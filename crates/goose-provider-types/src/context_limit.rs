use serde_json::Value;
use std::collections::HashMap;
use std::future::Future;

use crate::canonical::maybe_get_canonical_model;
use crate::errors::ProviderError;
use crate::model::DEFAULT_CONTEXT_LIMIT;

#[derive(Debug, Clone, Default)]
pub struct ContextLimitResolver {
    provider_name: String,
    configured_limits: HashMap<String, usize>,
}

impl ContextLimitResolver {
    pub fn new(provider_name: impl Into<String>) -> Self {
        Self {
            provider_name: provider_name.into(),
            configured_limits: HashMap::new(),
        }
    }

    pub fn with_configured_limits(
        mut self,
        configured_limits: impl IntoIterator<Item = (String, usize)>,
    ) -> Self {
        self.configured_limits = configured_limits
            .into_iter()
            .filter(|(_, context_limit)| *context_limit > 0)
            .collect();
        self
    }

    fn configured_limit(&self, model: &str) -> Option<usize> {
        self.configured_limits.get(model).copied().or_else(|| {
            let mut matches = self
                .configured_limits
                .iter()
                .filter(|(configured_model, _)| configured_model.eq_ignore_ascii_case(model));
            let (_, limit) = matches.next()?;
            matches.next().is_none().then_some(*limit)
        })
    }

    pub fn resolve_local(&self, model: &str, override_limit: Option<usize>) -> usize {
        override_limit
            .or_else(|| self.configured_limit(model))
            .or_else(|| {
                maybe_get_canonical_model(&self.provider_name, model)
                    .map(|canonical| canonical.limit.context)
            })
            .unwrap_or(DEFAULT_CONTEXT_LIMIT)
    }

    pub async fn resolve<F, Fut>(
        &self,
        model: &str,
        override_limit: Option<usize>,
        discover: F,
    ) -> usize
    where
        F: FnOnce() -> Fut,
        Fut: Future<Output = Result<Option<usize>, ProviderError>>,
    {
        if let Some(limit) = override_limit {
            return limit;
        }

        if let Some(limit) = self.configured_limit(model) {
            return limit;
        }

        match discover().await {
            Ok(Some(limit)) if limit > 0 => return limit,
            Ok(Some(_) | None) => {}
            Err(error) => tracing::warn!(
                provider = self.provider_name,
                model,
                %error,
                "Context-limit discovery failed; falling back"
            ),
        }

        maybe_get_canonical_model(&self.provider_name, model)
            .map(|canonical| canonical.limit.context)
            .unwrap_or(DEFAULT_CONTEXT_LIMIT)
    }
}

/// Does this upstream error mean the conversation outgrew the model's context?
///
/// Lives here rather than in `goose-providers` so the streaming parser in
/// `formats::openai` can reach it: an error arriving inside an SSE stream has
/// to be classified the same way as one arriving as an HTTP status, otherwise
/// a context overflow on a streaming provider looks like a generic server
/// error and the caller neither compacts nor tells the user what happened.
pub fn is_context_length_exceeded(payload: Option<&Value>, message: &str) -> bool {
    let payload_exceeded = payload
        .and_then(|payload| payload.get("error"))
        .is_some_and(|error| {
            error
                .get("code")
                .and_then(Value::as_str)
                .is_some_and(|code| code.eq_ignore_ascii_case("context_length_exceeded"))
                || match (
                    error.get("n_prompt_tokens").and_then(Value::as_f64),
                    error.get("n_ctx").and_then(Value::as_f64),
                ) {
                    (Some(prompt_tokens), Some(context_limit)) => {
                        context_limit > 0.0 && prompt_tokens > context_limit
                    }
                    _ => false,
                }
        });

    payload_exceeded || is_context_length_exceeded_message(message)
}

pub fn is_context_length_exceeded_message(text: &str) -> bool {
    let text_lower = text.to_lowercase();

    let direct_context_phrases = [
        "context length",
        "context_length_exceeded",
        "context window",
        "context_window_exceeded",
        "context limit",
        "maximum context",
        "max context",
        "maximum prompt length",
        "max prompt length",
    ];
    if direct_context_phrases
        .iter()
        .any(|phrase| text_lower.contains(phrase))
    {
        return true;
    }

    if text_lower.contains("reduce the length")
        && ["message", "messages", "input", "prompt"]
            .iter()
            .any(|word| text_lower.contains(word))
    {
        return true;
    }

    if [
        "input is too long",
        "input too long",
        "prompt is too long",
        "prompt too long",
    ]
    .iter()
    .any(|phrase| text_lower.contains(phrase))
    {
        return true;
    }

    let mentions_prompt_input_tokens = [
        "input token",
        "input length",
        "prompt token",
        "prompt length",
        "message token",
        "messages token",
        "request token",
        "total token",
    ]
    .iter()
    .any(|phrase| text_lower.contains(phrase));
    let mentions_limit = [
        "model limit",
        "model's limit",
        "maximum allowed",
        "max allowed",
        "maximum number of tokens",
        "token limit",
        "tokens limit",
    ]
    .iter()
    .any(|phrase| text_lower.contains(phrase));
    let mentions_overflow = ["exceed", "too long", "too large", "over the limit"]
        .iter()
        .any(|phrase| text_lower.contains(phrase));

    let words = text_lower.split(|character: char| !character.is_ascii_alphanumeric());
    let mentions_request = words.clone().any(|word| word == "request");
    let mentions_bytes = words.clone().any(|word| matches!(word, "byte" | "bytes"));
    let mentions_content_length = ["content length", "content-length"]
        .iter()
        .any(|phrase| text_lower.contains(phrase));
    let mentions_request_data_size = [
        "request size",
        "requestsize",
        "request body size",
        "request payload size",
        "payload size",
        "body size",
    ]
    .iter()
    .any(|phrase| text_lower.contains(phrase));
    let request_data_too_large = [
        "request body is too large",
        "request body too large",
        "request payload is too large",
        "request payload too large",
        "payload is too large",
        "payload too large",
    ]
    .iter()
    .any(|phrase| text_lower.contains(phrase));
    let mentions_byte_limit = mentions_request_data_size
        || request_data_too_large
        || (mentions_content_length && (mentions_request || mentions_bytes));
    if mentions_byte_limit && mentions_overflow {
        return true;
    }

    mentions_prompt_input_tokens && mentions_limit && mentions_overflow
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn applies_precedence() {
        let resolver = ContextLimitResolver::new("anthropic")
            .with_configured_limits([("claude-sonnet-4-5".to_string(), 64_000)]);

        assert_eq!(
            resolver
                .resolve("claude-sonnet-4-5", Some(32_000), || async {
                    Ok(Some(16_000))
                })
                .await,
            32_000
        );
        assert_eq!(
            resolver
                .resolve("claude-sonnet-4-5", None, || async { Ok(Some(16_000)) })
                .await,
            64_000
        );
    }

    #[test]
    fn configured_limits_match_case_insensitively() {
        let resolver = ContextLimitResolver::new("unknown-provider")
            .with_configured_limits([("MyModel".to_string(), 64_000)]);

        assert_eq!(resolver.resolve_local("mymodel", None), 64_000);
    }

    #[test]
    fn exact_match_wins_over_case_insensitive_matches() {
        let resolver = ContextLimitResolver::new("unknown-provider").with_configured_limits([
            ("MyModel".to_string(), 64_000),
            ("mymodel".to_string(), 32_000),
        ]);

        assert_eq!(resolver.resolve_local("MyModel", None), 64_000);
        assert_eq!(resolver.resolve_local("mymodel", None), 32_000);
        assert_eq!(
            resolver.resolve_local("MYMODEL", None),
            DEFAULT_CONTEXT_LIMIT
        );
    }

    #[test]
    fn ignores_zero_configured_limits() {
        let resolver = ContextLimitResolver::new("unknown-provider")
            .with_configured_limits([("configured".to_string(), 0)]);

        assert_eq!(
            resolver.resolve_local("configured", None),
            DEFAULT_CONTEXT_LIMIT
        );
    }

    #[test]
    fn local_resolution_skips_discovery() {
        let resolver = ContextLimitResolver::new("anthropic")
            .with_configured_limits([("configured".to_string(), 64_000)]);

        assert_eq!(resolver.resolve_local("configured", None), 64_000);
        assert_eq!(resolver.resolve_local("claude-sonnet-4-5", None), 1_000_000);
        assert_eq!(
            resolver.resolve_local("unknown", None),
            DEFAULT_CONTEXT_LIMIT
        );
    }

    #[tokio::test]
    async fn ignores_zero_discovered_limits() {
        let resolver = ContextLimitResolver::new("unknown-provider");

        assert_eq!(
            resolver
                .resolve("unknown-model", None, || async { Ok(Some(0)) })
                .await,
            DEFAULT_CONTEXT_LIMIT
        );
    }

    #[tokio::test]
    async fn uses_discovery_then_canonical_then_default() {
        let resolver = ContextLimitResolver::new("anthropic");
        assert_eq!(
            resolver
                .resolve("runtime-model", None, || async { Ok(Some(24_000)) })
                .await,
            24_000
        );
        assert_eq!(
            resolver
                .resolve("claude-sonnet-4-5", None, || async { Ok(None) })
                .await,
            1_000_000
        );
        assert_eq!(
            resolver
                .resolve("unknown-model", None, || async { Ok(None) })
                .await,
            DEFAULT_CONTEXT_LIMIT
        );
    }
}
