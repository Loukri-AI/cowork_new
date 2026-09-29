//! `.skill` bundles: the zip layout people share skills in.
//!
//! A bundle is a zip holding one top-level directory named after the skill,
//! containing `SKILL.md` and any supporting files it references:
//!
//! ```text
//! video-prompt-builder/
//!   SKILL.md
//!   references/effects-breakdown-reference.txt
//! ```
//!
//! This is the layout the wider agent-skills ecosystem uses, so a bundle
//! exported here opens elsewhere and one downloaded from elsewhere opens
//! here. The older single-file `.skill.json` export is kept for
//! compatibility, but it cannot carry supporting files.
//!
//! Bundles arrive from wherever a student found them, so nothing here trusts
//! the archive: paths are checked before any write, and the extracted size is
//! capped so a small download cannot fill the disk.

use std::collections::HashMap;
use std::io::{Cursor, Read, Write};
use std::path::{Component, Path, PathBuf};

use agent_client_protocol::Error;
use goose_sdk_types::custom_requests::{SourceEntry, SourceType};
use zip::write::SimpleFileOptions;
use zip::{CompressionMethod, ZipArchive, ZipWriter};

use super::supporting_files::create_source_file;
use super::{skill_base_dir, validate_skill_name};
use crate::sources::create_source;

/// Most of a bundle's weight should be its instructions, not payload.
const MAX_ENTRIES: usize = 128;
const MAX_TOTAL_BYTES: u64 = 8 * 1024 * 1024;
const MAX_FILE_BYTES: u64 = 4 * 1024 * 1024;

pub const SKILL_FILE: &str = "SKILL.md";

/// Reject anything that is not a plain relative path inside the bundle.
///
/// A zip entry names its own path, so an archive can ask to be written to an
/// absolute location or above its own directory. Refuse those outright rather
/// than normalising them, so a hostile bundle fails loudly.
fn safe_relative_path(raw: &str) -> Result<PathBuf, Error> {
    if raw.contains('\0') {
        return Err(Error::invalid_params().data("Bundle entry name contains a null byte"));
    }
    let path = Path::new(raw);
    if path.is_absolute() || raw.starts_with('/') || raw.starts_with('\\') {
        return Err(
            Error::invalid_params().data(format!("Bundle entry \"{raw}\" uses an absolute path"))
        );
    }
    for component in path.components() {
        match component {
            Component::Normal(_) => {}
            Component::CurDir => {}
            Component::ParentDir => {
                return Err(Error::invalid_params()
                    .data(format!("Bundle entry \"{raw}\" points outside the bundle")));
            }
            Component::RootDir | Component::Prefix(_) => {
                return Err(Error::invalid_params()
                    .data(format!("Bundle entry \"{raw}\" uses an absolute path")));
            }
        }
    }
    Ok(path.components().collect())
}

#[derive(Debug)]
struct BundleContents {
    skill_name: String,
    skill_md: String,
    supporting: Vec<(PathBuf, Vec<u8>)>,
}

fn read_bundle(bytes: &[u8]) -> Result<BundleContents, Error> {
    let mut archive = ZipArchive::new(Cursor::new(bytes))
        .map_err(|e| Error::invalid_params().data(format!("Not a readable .skill bundle: {e}")))?;

    if archive.len() > MAX_ENTRIES {
        return Err(Error::invalid_params().data(format!(
            "Bundle holds {} entries; the limit is {MAX_ENTRIES}",
            archive.len()
        )));
    }

    let mut top_level: Option<String> = None;
    let mut skill_md: Option<String> = None;
    let mut supporting: Vec<(PathBuf, Vec<u8>)> = Vec::new();
    let mut total: u64 = 0;

    for index in 0..archive.len() {
        let mut entry = archive
            .by_index(index)
            .map_err(|e| Error::invalid_params().data(format!("Unreadable bundle entry: {e}")))?;

        // `enclosed_name` is None exactly when the entry escapes its archive.
        let raw = entry.name().to_string();
        if entry.is_dir() {
            continue;
        }
        let relative = safe_relative_path(&raw)?;
        let mut parts = relative.components();
        let Some(Component::Normal(first)) = parts.next() else {
            return Err(Error::invalid_params().data(format!(
                "Bundle entry \"{raw}\" is not inside a skill directory"
            )));
        };
        let first = first.to_string_lossy().to_string();

        // Everything must live under one directory, which names the skill.
        match &top_level {
            None => top_level = Some(first.clone()),
            Some(existing) if *existing != first => {
                return Err(Error::invalid_params().data(
                    "Bundle holds more than one top-level directory; it must contain exactly one skill",
                ));
            }
            Some(_) => {}
        }

        let inner: PathBuf = parts.collect();
        if inner.as_os_str().is_empty() {
            return Err(Error::invalid_params().data(format!(
                "Bundle entry \"{raw}\" is not inside a skill directory"
            )));
        }

        // Trust the declared size only as a first filter; the real bound is
        // how much is actually read below.
        if entry.size() > MAX_FILE_BYTES {
            return Err(
                Error::invalid_params().data(format!("Bundle entry \"{raw}\" is larger than 4 MB"))
            );
        }

        let mut buffer = Vec::new();
        entry
            .by_ref()
            .take(MAX_FILE_BYTES + 1)
            .read_to_end(&mut buffer)
            .map_err(|e| Error::invalid_params().data(format!("Unreadable bundle entry: {e}")))?;
        if buffer.len() as u64 > MAX_FILE_BYTES {
            return Err(
                Error::invalid_params().data(format!("Bundle entry \"{raw}\" is larger than 4 MB"))
            );
        }
        total += buffer.len() as u64;
        if total > MAX_TOTAL_BYTES {
            return Err(Error::invalid_params().data("Bundle expands to more than 8 MB"));
        }

        if inner == Path::new(SKILL_FILE) {
            skill_md = Some(
                String::from_utf8(buffer)
                    .map_err(|_| Error::invalid_params().data("SKILL.md is not valid UTF-8"))?,
            );
        } else {
            supporting.push((inner, buffer));
        }
    }

    let skill_name = top_level.ok_or_else(|| Error::invalid_params().data("Bundle is empty"))?;
    let skill_md = skill_md.ok_or_else(|| {
        Error::invalid_params().data(format!("Bundle has no {skill_name}/{SKILL_FILE}"))
    })?;

    Ok(BundleContents {
        skill_name,
        skill_md,
        supporting,
    })
}

/// Split `SKILL.md` into its description and body.
///
/// A skill with no description is unusable: the description is the only thing
/// the model sees before deciding whether to load it.
fn parse_front_matter(raw: &str) -> Result<(Option<String>, String, String), Error> {
    let parsed =
        crate::sources::parse_frontmatter::<super::SkillFrontmatter>(raw).map_err(|e| {
            Error::invalid_params().data(format!("SKILL.md frontmatter is not valid YAML: {e}"))
        })?;
    let Some((meta, body)) = parsed else {
        return Err(Error::invalid_params().data("SKILL.md has no frontmatter block"));
    };
    let description = meta.description.trim().to_string();
    if description.is_empty() {
        return Err(Error::invalid_params().data("SKILL.md has no description in its frontmatter"));
    }
    let name = meta
        .name
        .map(|n| n.trim().to_string())
        .filter(|n| !n.is_empty());
    Ok((name, description, body))
}

/// Install a `.skill` bundle, returning the skill it created.
pub fn import_bundle(
    bytes: &[u8],
    global: bool,
    project_dir: Option<&str>,
) -> Result<SourceEntry, Error> {
    let contents = read_bundle(bytes)?;
    let (declared_name, description, body) = parse_front_matter(&contents.skill_md)?;

    // The directory names the skill; frontmatter may disagree, and when it
    // does the frontmatter is what the runtime indexes by.
    let name = declared_name.unwrap_or_else(|| contents.skill_name.clone());
    validate_skill_name(&name)?;

    let base = skill_base_dir(global, project_dir)?;
    let mut final_name = name.clone();
    let mut counter = 2u32;
    while base.join(&final_name).exists() {
        final_name = format!("{name}-{counter}");
        counter += 1;
    }

    let entry = create_source(
        SourceType::Skill,
        &final_name,
        &description,
        &body,
        global,
        project_dir,
        HashMap::new(),
    )?;

    let dir = base.join(&final_name);
    for (relative, data) in contents.supporting {
        // Confines the write to `dir`, so a name that slipped the checks
        // above still cannot land outside the skill.
        create_source_file(&dir, &relative, &data).map_err(|e| {
            Error::internal_error().data(format!("Failed to write {}: {e}", relative.display()))
        })?;
    }

    Ok(entry)
}

/// Pack an installed skill into a `.skill` bundle.
pub fn export_bundle(skill_dir: &Path, name: &str) -> Result<Vec<u8>, Error> {
    let mut buffer = Vec::new();
    {
        let mut writer = ZipWriter::new(Cursor::new(&mut buffer));
        let options = SimpleFileOptions::default().compression_method(CompressionMethod::Deflated);

        let add = |writer: &mut ZipWriter<Cursor<&mut Vec<u8>>>,
                   relative: &Path,
                   data: &[u8]|
         -> Result<(), Error> {
            let name_in_zip = format!("{}/{}", name, relative.to_string_lossy().replace('\\', "/"));
            writer.start_file(name_in_zip, options).map_err(|e| {
                Error::internal_error().data(format!("Failed to write bundle: {e}"))
            })?;
            writer
                .write_all(data)
                .map_err(|e| Error::internal_error().data(format!("Failed to write bundle: {e}")))
        };

        let skill_md = std::fs::read(skill_dir.join(SKILL_FILE)).map_err(|e| {
            Error::internal_error().data(format!("Failed to read {SKILL_FILE}: {e}"))
        })?;
        add(&mut writer, Path::new(SKILL_FILE), &skill_md)?;

        for relative in walk_supporting(skill_dir)? {
            let data = std::fs::read(skill_dir.join(&relative)).map_err(|e| {
                Error::internal_error().data(format!("Failed to read {}: {e}", relative.display()))
            })?;
            add(&mut writer, &relative, &data)?;
        }

        writer
            .finish()
            .map_err(|e| Error::internal_error().data(format!("Failed to finish bundle: {e}")))?;
    }
    Ok(buffer)
}

/// Every file under the skill directory except `SKILL.md`, as relative paths.
///
/// Symlinks are skipped: following one would pull a file from outside the
/// skill into a bundle the student then shares.
fn walk_supporting(skill_dir: &Path) -> Result<Vec<PathBuf>, Error> {
    let mut found = Vec::new();
    let mut stack = vec![skill_dir.to_path_buf()];
    while let Some(dir) = stack.pop() {
        let entries = std::fs::read_dir(&dir).map_err(|e| {
            Error::internal_error().data(format!("Failed to read {}: {e}", dir.display()))
        })?;
        for entry in entries.flatten() {
            let path = entry.path();
            let metadata = match std::fs::symlink_metadata(&path) {
                Ok(m) => m,
                Err(_) => continue,
            };
            if metadata.file_type().is_symlink() {
                continue;
            }
            if metadata.is_dir() {
                stack.push(path);
                continue;
            }
            if let Ok(relative) = path.strip_prefix(skill_dir) {
                if relative != Path::new(SKILL_FILE) {
                    found.push(relative.to_path_buf());
                }
            }
        }
    }
    found.sort();
    Ok(found)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn bundle_with(entries: &[(&str, &[u8])]) -> Vec<u8> {
        let mut buffer = Vec::new();
        {
            let mut writer = ZipWriter::new(Cursor::new(&mut buffer));
            let options =
                SimpleFileOptions::default().compression_method(CompressionMethod::Deflated);
            for (name, data) in entries {
                writer.start_file(*name, options).unwrap();
                writer.write_all(data).unwrap();
            }
            writer.finish().unwrap();
        }
        buffer
    }

    const GOOD_SKILL: &[u8] =
        b"---\nname: demo-skill\ndescription: A demo skill for tests.\n---\n\nBody here.\n";

    #[test]
    fn reads_a_well_formed_bundle() {
        let zip = bundle_with(&[
            ("demo-skill/SKILL.md", GOOD_SKILL),
            ("demo-skill/references/notes.txt", b"supporting"),
        ]);
        let contents = read_bundle(&zip).unwrap();
        assert_eq!(contents.skill_name, "demo-skill");
        assert!(contents.skill_md.contains("Body here."));
        assert_eq!(contents.supporting.len(), 1);
        assert_eq!(contents.supporting[0].0, Path::new("references/notes.txt"));
    }

    /// A bundle comes from wherever the student found it, so an entry that
    /// climbs out of its own directory must be refused, not normalised.
    #[test]
    fn rejects_paths_that_escape_the_bundle() {
        let zip = bundle_with(&[
            ("demo-skill/SKILL.md", GOOD_SKILL),
            ("demo-skill/../../../.ssh/authorized_keys", b"pwned"),
        ]);
        let error = read_bundle(&zip).unwrap_err();
        assert!(
            format!("{error:?}").contains("outside the bundle"),
            "unexpected error: {error:?}"
        );
    }

    #[test]
    fn rejects_absolute_paths() {
        assert!(safe_relative_path("/etc/passwd").is_err());
        assert!(safe_relative_path("demo/../..").is_err());
        assert!(safe_relative_path("demo/ok.txt").is_ok());
    }

    #[test]
    fn rejects_a_bundle_with_two_skills() {
        let zip = bundle_with(&[("one/SKILL.md", GOOD_SKILL), ("two/SKILL.md", GOOD_SKILL)]);
        let error = read_bundle(&zip).unwrap_err();
        assert!(format!("{error:?}").contains("more than one top-level directory"));
    }

    #[test]
    fn rejects_a_bundle_with_no_skill_file() {
        let zip = bundle_with(&[("demo-skill/readme.txt", b"nothing here")]);
        let error = read_bundle(&zip).unwrap_err();
        assert!(format!("{error:?}").contains("has no demo-skill/SKILL.md"));
    }

    #[test]
    fn rejects_a_skill_without_a_description() {
        let raw = "---\nname: demo\n---\nBody";
        let error = parse_front_matter(raw).unwrap_err();
        assert!(format!("{error:?}").contains("no description"));
    }

    #[test]
    fn splits_frontmatter_from_body() {
        let (name, description, body) = parse_front_matter(
            "---\nname: demo-skill\ndescription: Does a thing.\n---\n\nThe body.\n",
        )
        .unwrap();
        assert_eq!(name.as_deref(), Some("demo-skill"));
        assert_eq!(description, "Does a thing.");
        assert_eq!(body.trim(), "The body.");
    }

    #[test]
    fn round_trips_through_export_and_read() {
        let dir = tempfile::tempdir().unwrap();
        let skill_dir = dir.path().join("demo-skill");
        std::fs::create_dir_all(skill_dir.join("references")).unwrap();
        std::fs::write(skill_dir.join(SKILL_FILE), GOOD_SKILL).unwrap();
        std::fs::write(skill_dir.join("references/notes.txt"), b"supporting").unwrap();

        let zip = export_bundle(&skill_dir, "demo-skill").unwrap();
        let contents = read_bundle(&zip).unwrap();

        assert_eq!(contents.skill_name, "demo-skill");
        assert!(contents.skill_md.contains("Body here."));
        assert_eq!(contents.supporting.len(), 1);
        assert_eq!(contents.supporting[0].1, b"supporting");
    }
}

#[cfg(test)]
mod real_bundle_check {
    use super::*;

    /// Checked against a bundle produced by another tool, not by us, so the
    /// reader is verified against the real-world layout rather than only
    /// against zips this module wrote. Skipped when the sample is absent.
    #[test]
    fn reads_a_bundle_made_elsewhere() {
        let sample = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../assets/video-prompt-builder.skill");
        let Ok(bytes) = std::fs::read(&sample) else {
            eprintln!("sample bundle absent, skipping");
            return;
        };
        let contents = read_bundle(&bytes).expect("real .skill bundle should read");
        assert_eq!(contents.skill_name, "video-prompt-builder");
        let (name, description, body) =
            parse_front_matter(&contents.skill_md).expect("frontmatter should parse");
        assert_eq!(name.as_deref(), Some("video-prompt-builder"));
        assert!(description.contains("video prompt"));
        assert!(!body.trim().is_empty());
        assert_eq!(contents.supporting.len(), 1, "expected the references file");
    }
}
