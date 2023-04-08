import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import Dropdown, { Option } from 'app/dim-ui/Dropdown';
import KeyHelp from 'app/dim-ui/KeyHelp';
import usePrompt from 'app/dim-ui/usePrompt';
import { useHotkey, useHotkeys } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import { TagCommand, itemTagList } from 'app/inventory/dim-item-info';
import { DimStore } from 'app/inventory/store-types';
import { getCurrentStore, getVault } from 'app/inventory/stores-helpers';
import {
  AppIcon,
  lockIcon,
  moveIcon,
  stickyNoteIcon,
  tagIcon,
  unlockedIcon,
} from 'app/shell/icons';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { useCallback, useMemo } from 'react';
import styles from './ItemActions.m.scss';

export interface TagCommandInfo {
  type?: TagCommand;
  label: string;
  sortOrder?: number;
  displacePriority?: number;
  hotkey?: string;
  icon?: string | IconDefinition;
}

const bulkItemTags: TagCommandInfo[] = Array.from(itemTagList);
bulkItemTags.push({ type: 'clear', label: 'Tags.ClearTag', hotkey: 'shift+0' });

function ItemActions({
  stores,
  itemsAreSelected,
  onLock,
  onNote,
  onTagSelectedItems,
  onMoveSelectedItems,
}: {
  stores: DimStore[];
  itemsAreSelected: boolean;
  onLock: (locked: boolean) => void;
  onNote: (note?: string) => void;
  onTagSelectedItems: (tagInfo: TagCommandInfo) => void;
  onMoveSelectedItems: (store: DimStore) => void;
}) {
  const isPhonePortrait = useIsPhonePortrait();
  const currentStore = getCurrentStore(stores)!;
  const vault = getVault(stores)!;
  const tagItems: Option[] = bulkItemTags.map((tagInfo) => ({
    key: tagInfo.label,
    content: (
      <>
        {tagInfo.icon && <AppIcon icon={tagInfo.icon} />} {t(tagInfo.label)}
        {!isPhonePortrait && tagInfo.hotkey && (
          <KeyHelp combo={tagInfo.hotkey} className={styles.keyHelp} />
        )}
      </>
    ),
    onSelected: () => onTagSelectedItems(tagInfo),
  }));

  const moveItems: Option[] = stores.map((store) => ({
    key: store.id,
    content: (
      <>
        <img height="16" width="16" src={store.icon} />{' '}
        <span className={styles.storeName}>{store.name}</span>
        {!isPhonePortrait &&
          (store === vault ? (
            <KeyHelp combo="V" className={styles.keyHelp} />
          ) : store === currentStore ? (
            <KeyHelp combo="P" className={styles.keyHelp} />
          ) : null)}
      </>
    ),
    onSelected: () => onMoveSelectedItems(store),
  }));

  const hotkeys = useMemo(() => {
    const hotkeys = [];
    for (const tag of bulkItemTags) {
      if (tag.hotkey) {
        hotkeys.push({
          combo: tag.hotkey,
          description: t('Hotkey.MarkItemAs', { tag: tag.type }),
          callback: () => onTagSelectedItems(tag),
        });
      }
    }
    return hotkeys;
  }, [onTagSelectedItems]);

  useHotkeys(hotkeys);

  // TODO: replace with rich-text dialog, and an "append" option
  const [promptDialog, prompt] = usePrompt();
  const noted = useCallback(async () => {
    const note = await prompt(t('Organizer.NotePrompt'));
    if (note !== null) {
      onNote(note || undefined);
    }
  }, [onNote, prompt]);

  useHotkey('n', t('Hotkey.Note'), noted);

  useHotkey(
    'p',
    t('Hotkey.Pull'),
    useCallback(() => onMoveSelectedItems(currentStore), [currentStore, onMoveSelectedItems])
  );
  useHotkey(
    'v',
    t('Hotkey.Vault'),
    useCallback(() => onMoveSelectedItems(vault), [vault, onMoveSelectedItems])
  );

  return (
    <div className={styles.itemActions}>
      {promptDialog}
      <button
        type="button"
        className={`dim-button ${styles.actionButton}`}
        disabled={!itemsAreSelected}
        name="lock"
        onClick={() => onLock(true)}
      >
        <AppIcon icon={lockIcon} />
        <span className={styles.label}>{t('Organizer.Lock')}</span>
      </button>
      <button
        type="button"
        className={`dim-button ${styles.actionButton}`}
        disabled={!itemsAreSelected}
        name="unlock"
        onClick={() => onLock(false)}
      >
        <AppIcon icon={unlockedIcon} />
        <span className={styles.label}>{t('Organizer.Unlock')}</span>
      </button>
      <Dropdown disabled={!itemsAreSelected} options={tagItems} className={styles.actionButton}>
        <AppIcon icon={tagIcon} />
        <span className={styles.label}>{t('Organizer.BulkTag')}</span>
      </Dropdown>
      <Dropdown disabled={!itemsAreSelected} options={moveItems} className={styles.actionButton}>
        <AppIcon icon={moveIcon} />
        <span className={styles.label}>{t('Organizer.BulkMove')}</span>
      </Dropdown>
      <button
        type="button"
        className={`dim-button ${styles.actionButton}`}
        disabled={!itemsAreSelected}
        name="note"
        onClick={noted}
        title={t('Organizer.Note') + ' [N]'}
        aria-keyshortcuts="n"
      >
        <AppIcon icon={stickyNoteIcon} />
        <span className={styles.label}>{t('Organizer.Note')}</span>
      </button>
      <span className={styles.tip}> {t('Organizer.ShiftTip')}</span>
    </div>
  );
}

export default ItemActions;
