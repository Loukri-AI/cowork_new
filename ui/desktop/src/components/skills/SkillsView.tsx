import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Zap, AlertCircle, Plus, Upload, MoreVertical, Download, Trash2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { MainPanelLayout } from '../Layout/MainPanelLayout';
import { errorMessage } from '../../utils/conversionUtils';
import { getInitialWorkingDir } from '../../utils/workingDir';
import { defineMessages, useIntl } from '../../i18n';
import { SearchView } from '../conversation/SearchView';
import { getSearchShortcutText } from '../../utils/keyboardShortcuts';
import {
  listSkillSources,
  importSkillBundle,
  exportSkillBundle,
  deleteSkillSource,
} from '../../acp/sources';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { toast } from 'react-toastify';

const i18n = defineMessages({
  importSkill: {
    id: 'skillsView.importSkill',
    defaultMessage: 'Import skill',
  },
  importSkillHint: {
    id: 'skillsView.importSkillHint',
    defaultMessage: 'Install a .skill file someone shared with you',
  },
  importSucceeded: {
    id: 'skillsView.importSucceeded',
    defaultMessage: 'Installed the skill {name}',
  },
  importFailed: {
    id: 'skillsView.importFailed',
    defaultMessage: 'Could not install that skill: {error}',
  },
  errorLoadingSkills: {
    id: 'skillsView.errorLoadingSkills',
    defaultMessage: 'Error Loading Skills',
  },
  tryAgain: {
    id: 'skillsView.tryAgain',
    defaultMessage: 'Try Again',
  },
  noSkillsInstalled: {
    id: 'skillsView.noSkillsInstalled',
    defaultMessage: 'No skills installed',
  },
  noSkillsDescription: {
    id: 'skillsView.noSkillsDescription',
    defaultMessage:
      'Skills are loaded from SKILL.md files in ~/.config/agents/skills/, .goose/skills/, or other supported directories.',
  },
  noMatchingSkills: {
    id: 'skillsView.noMatchingSkills',
    defaultMessage: 'No matching skills found',
  },
  adjustSearchTerms: {
    id: 'skillsView.adjustSearchTerms',
    defaultMessage: 'Try adjusting your search terms',
  },
  skillsTitle: {
    id: 'skillsView.skillsTitle',
    defaultMessage: 'Skills',
  },
  addSkill: {
    id: 'skillsView.addSkill',
    defaultMessage: 'Add Skill',
  },
  skillsDescription: {
    id: 'skillsView.skillsDescription',
    defaultMessage: 'View installed skills that extend CoWork capabilities. {shortcut} to search.',
  },
  searchSkillsPlaceholder: {
    id: 'skillsView.searchSkillsPlaceholder',
    defaultMessage: 'Search skills...',
  },
  comingSoon: {
    id: 'skillsView.comingSoon',
    defaultMessage: 'Coming soon',
  },
  skillActions: {
    id: 'skillsView.skillActions',
    defaultMessage: 'Skill actions',
  },
  download: {
    id: 'skillsView.download',
    defaultMessage: 'Download',
  },
  remove: {
    id: 'skillsView.remove',
    defaultMessage: 'Remove',
  },
  builtIn: {
    id: 'skillsView.builtIn',
    defaultMessage: 'Built in',
  },
  downloadFailed: {
    id: 'skillsView.downloadFailed',
    defaultMessage: 'Could not download that skill: {error}',
  },
  removed: {
    id: 'skillsView.removed',
    defaultMessage: 'Removed {name}',
  },
  removeFailed: {
    id: 'skillsView.removeFailed',
    defaultMessage: 'Could not remove that skill: {error}',
  },
});

interface SkillEntry {
  name: string;
  description: string;
  path: string;
  /** Built-ins ship inside the app, so they cannot be edited or removed. */
  builtIn: boolean;
}

function SkillItem({
  skill,
  onDownload,
  onRemove,
}: {
  skill: SkillEntry;
  onDownload: (skill: SkillEntry) => void;
  onRemove: (skill: SkillEntry) => void;
}) {
  const intl = useIntl();
  return (
    <Card className="py-2 px-4 mb-2 bg-background-primary border-none hover:bg-background-secondary transition-all duration-150">
      <div className="flex justify-between items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base truncate">{skill.name}</h3>
            {skill.builtIn && (
              <span className="text-xs text-text-muted border border-border-subtle rounded px-1.5 py-0.5 shrink-0">
                {intl.formatMessage(i18n.builtIn)}
              </span>
            )}
          </div>
          <p className="text-text-secondary text-sm line-clamp-2">{skill.description}</p>
        </div>
        {/* Built-ins live inside the binary, so there is no file to hand back
            and nothing on disk to delete. */}
        {!skill.builtIn && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-2 rounded hover:bg-background-muted shrink-0"
                title={intl.formatMessage(i18n.skillActions)}
                aria-label={intl.formatMessage(i18n.skillActions)}
              >
                <MoreVertical className="w-4 h-4 text-text-secondary" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDownload(skill)}>
                <Download className="w-4 h-4 mr-2" />
                {intl.formatMessage(i18n.download)}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onRemove(skill)}
                className="text-red-500 focus:text-red-500"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {intl.formatMessage(i18n.remove)}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </Card>
  );
}

function SkillSkeleton() {
  return (
    <Card className="p-2 mb-2 bg-background-primary">
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </Card>
  );
}

export default function SkillsView() {
  const intl = useIntl();
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredSkills = useMemo(() => {
    if (!searchTerm) return skills;
    const searchLower = searchTerm.toLowerCase();
    return skills.filter(
      (skill) =>
        skill.name.toLowerCase().includes(searchLower) ||
        skill.description.toLowerCase().includes(searchLower)
    );
  }, [skills, searchTerm]);

  const loadSkills = useCallback(async () => {
    try {
      setLoading(true);
      setShowSkeleton(true);
      setShowContent(false);
      setError(null);
      const sources = await listSkillSources(getInitialWorkingDir());
      const skillEntries: SkillEntry[] = sources.map((source) => ({
        name: source.name,
        description: source.description,
        path: source.path,
        builtIn: source.type === 'builtinSkill',
      }));
      setSkills(skillEntries);
    } catch (err) {
      setError(errorMessage(err, 'Failed to load skills'));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDownload = useCallback(
    async (skill: SkillEntry) => {
      try {
        const { bytes, filename } = await exportSkillBundle(skill.path);
        // Same hand-off the session export uses: a blob and a synthetic link.
        // Copy out of the view: a Uint8Array can be backed by a
        // SharedArrayBuffer, which Blob does not accept.
        const buffer = bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength
        ) as ArrayBuffer;
        const url = URL.createObjectURL(new Blob([buffer], { type: 'application/zip' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        toast.error(
          intl.formatMessage(i18n.downloadFailed, { error: errorMessage(err, 'Unknown error') })
        );
      }
    },
    [intl]
  );

  const handleRemove = useCallback(
    async (skill: SkillEntry) => {
      try {
        await deleteSkillSource(skill.path);
        toast.success(intl.formatMessage(i18n.removed, { name: skill.name }));
        await loadSkills();
      } catch (err) {
        toast.error(
          intl.formatMessage(i18n.removeFailed, { error: errorMessage(err, 'Unknown error') })
        );
      }
    },
    [intl, loadSkills]
  );

  const handleBundleChosen = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      // Clear it straight away so choosing the same file twice still fires.
      event.target.value = '';
      if (!file) return;

      setImporting(true);
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const source = await importSkillBundle(bytes, getInitialWorkingDir());
        toast.success(intl.formatMessage(i18n.importSucceeded, { name: source.name }));
        await loadSkills();
      } catch (err) {
        toast.error(
          intl.formatMessage(i18n.importFailed, { error: errorMessage(err, 'Unknown error') })
        );
      } finally {
        setImporting(false);
      }
    },
    [intl, loadSkills]
  );

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  useEffect(() => {
    if (!loading && showSkeleton) {
      const timer = setTimeout(() => {
        setShowSkeleton(false);
        setTimeout(() => setShowContent(true), 50);
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [loading, showSkeleton]);

  const renderContent = () => {
    if (loading || showSkeleton) {
      return (
        <div className="space-y-2">
          <SkillSkeleton />
          <SkillSkeleton />
          <SkillSkeleton />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-text-secondary">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-lg mb-2">{intl.formatMessage(i18n.errorLoadingSkills)}</p>
          <p className="text-sm text-center mb-4">{error}</p>
          <Button onClick={loadSkills} variant="default">
            {intl.formatMessage(i18n.tryAgain)}
          </Button>
        </div>
      );
    }

    if (skills.length === 0) {
      return (
        <div className="flex flex-col justify-center pt-2 h-full">
          <p className="text-lg">{intl.formatMessage(i18n.noSkillsInstalled)}</p>
          <p className="text-sm text-text-secondary">
            {intl.formatMessage(i18n.noSkillsDescription)}
          </p>
        </div>
      );
    }

    if (filteredSkills.length === 0 && searchTerm) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-text-secondary mt-4">
          <Zap className="h-12 w-12 mb-4" />
          <p className="text-lg mb-2">{intl.formatMessage(i18n.noMatchingSkills)}</p>
          <p className="text-sm">{intl.formatMessage(i18n.adjustSearchTerms)}</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {filteredSkills.map((skill) => (
          <SkillItem
            key={skill.path || skill.name}
            skill={skill}
            onDownload={handleDownload}
            onRemove={handleRemove}
          />
        ))}
      </div>
    );
  };

  return (
    <MainPanelLayout>
      <div className="flex-1 flex flex-col min-h-0">
        <div className="bg-background-primary px-8 pb-8 pt-16">
          <div className="flex flex-col page-transition">
            <div className="flex justify-between items-center mb-1">
              <h1 className="text-4xl font-light">{intl.formatMessage(i18n.skillsTitle)}</h1>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".skill,.zip"
                  className="hidden"
                  onChange={handleBundleChosen}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={importing}
                  onClick={() => fileInputRef.current?.click()}
                  title={intl.formatMessage(i18n.importSkillHint)}
                >
                  <Upload className="w-4 h-4" />
                  {intl.formatMessage(i18n.importSkill)}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  hidden
                  title={intl.formatMessage(i18n.comingSoon)}
                >
                  <Plus className="w-4 h-4" />
                  {intl.formatMessage(i18n.addSkill)}
                </Button>
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-1">
              {intl.formatMessage(i18n.skillsDescription, {
                shortcut: getSearchShortcutText(),
              })}
            </p>
          </div>
        </div>

        <div className="flex-1 min-h-0 relative px-8">
          <ScrollArea className="h-full">
            <SearchView
              onSearch={(term) => setSearchTerm(term)}
              placeholder={intl.formatMessage(i18n.searchSkillsPlaceholder)}
            >
              <div
                className={`h-full relative transition-all duration-300 ${
                  showContent || showSkeleton ? 'opacity-100 animate-in fade-in' : 'opacity-0'
                }`}
              >
                {renderContent()}
              </div>
            </SearchView>
          </ScrollArea>
        </div>
      </div>
    </MainPanelLayout>
  );
}
