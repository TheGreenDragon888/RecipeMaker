// PRESENTATION LAYER: the Bookmarks tab, as drawn on the board: the saved recipes, newest first, with a search box,
// filter chips and how ready each is to cook from the saved pantry. Removing one offers Undo for 5 seconds. The
// list shows as soon as it loads; readiness arrives after it, and without a pantry the screen is a plain list.
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, type ListRenderItem, StyleSheet, Text, View } from 'react-native';
import type { RecipeServices } from '../../createRecipeServices';
import {
  countBookmarksByFilter,
  newestBookmarksFirst,
  selectBookmarks,
  type BookmarkFilter,
  type SavedRecipe,
} from '../../domain/bookmarks';
import type { RecipeReadiness } from '../../domain/recipeReadiness';
import { BookmarkCard } from '../components/BookmarkCard';
import { Icon } from '../components/Icon';
import { NoticeBar } from '../components/NoticeBar';
import { PressableScale } from '../components/PressableScale';
import { ReadinessFilterChips } from '../components/ReadinessFilterChips';
import { SearchField } from '../components/SearchField';
import { StateMessage } from '../components/StateMessage';
import { TapAwayToDismiss } from '../components/TapAwayToDismiss';
import {
  BOOKMARKS_TAGLINE,
  formatBookmarksSummary,
  formatRemovedBookmark,
  formatUndoBookmarkLabel,
} from '../format/bookmarks';
import { colors, dock, fonts, fontSize, radii, spacing } from '../theme';
import { BOOKMARK_NOTICE_MS } from '../useRecipeBookmarks';

/** How long Undo stays after a removal, as on the Pantry screen. */
export const UNDO_BOOKMARK_MS = 5000;

/** How many cards the list builds around the screen (see RecipesScreen). */
const LIST_WINDOW = { initialNumToRender: 8, maxToRenderPerBatch: 8, windowSize: 5 };
/** Extra room under the last card, so the Undo bar doesn't cover it (the board's 160 px against the dock's 100). */
const UNDO_BAR_ROOM = 60;

const recipeKey = ({ recipe }: SavedRecipe) => String(recipe.id);

type Props = {
  services: RecipeServices;
  onOpenRecipe: (recipeId: number) => void;
  onBrowseRecipes: () => void;
  /** Room to leave at the bottom for the tab bar (platform/dockLayout's dockClearance). Defaults to the board's. */
  bottomClearance?: number;
  /** Changes when the screen comes back into view, so changes to bookmarks and the pantry show here. */
  refreshKey?: number;
};

type Load = { status: 'loading' } | { status: 'failed' } | { status: 'done'; saved: SavedRecipe[] };
type Readiness =
  | { status: 'checking' | 'noPantry' | 'failed' }
  | { status: 'done'; byRecipe: ReadonlyMap<number, RecipeReadiness> };

type RowProps = {
  item: SavedRecipe;
  readiness: RecipeReadiness | null;
  onOpenRecipe: (recipeId: number) => void;
  onRemove: (item: SavedRecipe) => void;
};

/** One card in the list. Memoized with stable props, so a change to one recipe doesn't redraw the others. */
const BookmarkRow = memo(function BookmarkRow({ item, readiness, onOpenRecipe, onRemove }: RowProps) {
  return (
    <BookmarkCard
      recipe={item.recipe}
      readiness={readiness}
      onPress={() => onOpenRecipe(item.recipe.id)}
      onRemove={() => onRemove(item)}
    />
  );
});

export function BookmarksScreen({
  services,
  onOpenRecipe,
  onBrowseRecipes,
  bottomClearance = dock.clearance,
  refreshKey = 0,
}: Props) {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [readiness, setReadiness] = useState<Readiness>({ status: 'checking' });
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<BookmarkFilter>('all');
  /** The latest removal, while Undo is offered. */
  const [removed, setRemoved] = useState<SavedRecipe | null>(null);
  /** Failed saves since the notice last went away; each one restarts its timer. */
  const [failures, setFailures] = useState(0);
  /** Counts removals and Undos, so a reload that started before one can't overwrite it. */
  const changes = useRef(0);

  useEffect(() => {
    let current = true;
    const changesWhenStarted = changes.current;
    services.listBookmarks().then(
      (saved) => {
        if (!current) return;
        if (changes.current === changesWhenStarted) setLoad({ status: 'done', saved });
        services.checkRecipesReadiness(saved.map(({ recipe }) => recipe.id)).then(
          (byRecipe) => {
            if (current) setReadiness(byRecipe ? { status: 'done', byRecipe } : { status: 'noPantry' });
          },
          () => {
            if (current) setReadiness({ status: 'failed' });
          },
        );
      },
      () => {
        // A list already on screen stays; only a first load that fails has nothing to show.
        if (current) setLoad((shown) => (shown.status === 'done' ? shown : { status: 'failed' }));
      },
    );
    return () => {
      current = false;
    };
  }, [services, refreshKey]);

  useEffect(() => {
    if (removed === null) return;
    const timer = setTimeout(() => setRemoved(null), UNDO_BOOKMARK_MS);
    return () => clearTimeout(timer);
  }, [removed]);

  useEffect(() => {
    if (failures === 0) return;
    const timer = setTimeout(() => setFailures(0), BOOKMARK_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [failures]);

  const changeSaved = useCallback((change: (saved: SavedRecipe[]) => SavedRecipe[]) => {
    changes.current += 1;
    setLoad((shown) => (shown.status === 'done' ? { status: 'done', saved: change(shown.saved) } : shown));
  }, []);

  const putBack = useCallback(
    (item: SavedRecipe) => changeSaved((saved) => newestBookmarksFirst([...saved, item])),
    [changeSaved],
  );
  const takeOff = useCallback(
    (item: SavedRecipe) => changeSaved((saved) => saved.filter(({ recipe }) => recipe.id !== item.recipe.id)),
    [changeSaved],
  );

  const remove = useCallback(
    (item: SavedRecipe) => {
      takeOff(item);
      setRemoved(item);
      services.removeBookmark(item.recipe.id).catch(() => {
        putBack(item);
        setRemoved((latest) => (latest === item ? null : latest));
        setFailures((count) => count + 1);
      });
    },
    [putBack, services, takeOff],
  );

  function undo(item: SavedRecipe) {
    putBack(item);
    setRemoved(null);
    services.restoreBookmark({ recipeId: item.recipe.id, savedOrder: item.savedOrder }).catch(() => {
      takeOff(item);
      setFailures((count) => count + 1);
    });
  }

  const byRecipe = readiness.status === 'done' ? readiness.byRecipe : null;
  const saved = load.status === 'done' ? load.saved : [];
  const counts = useMemo(() => countBookmarksByFilter(saved, byRecipe), [saved, byRecipe]);
  const visible = useMemo(() => selectBookmarks(saved, { filter, query, readiness: byRecipe }), [saved, filter, query, byRecipe]);

  // The list redraws every card when these change, so they stay the same objects across the screen's redraws.
  const renderItem = useCallback<ListRenderItem<SavedRecipe>>(
    ({ item }) => (
      <BookmarkRow item={item} readiness={byRecipe?.get(item.recipe.id) ?? null} onOpenRecipe={onOpenRecipe} onRemove={remove} />
    ),
    [byRecipe, onOpenRecipe, remove],
  );
  const listContentStyle = useMemo(
    () => [styles.listContent, { paddingBottom: bottomClearance + UNDO_BAR_ROOM }],
    [bottomClearance],
  );

  return (
    // The tap-away wrapper goes around the parts that don't scroll, never around the list or the chips' row: a view
    // that takes a touch on a blank spot would stop them scrolling from that spot (see TapAwayToDismiss).
    <View style={styles.screen}>
      <TapAwayToDismiss fill={false}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Bookmarks</Text>
            <Text style={styles.tagline} numberOfLines={1}>
              {BOOKMARKS_TAGLINE}
            </Text>
          </View>
          {load.status === 'done' ? (
            <Text style={styles.summary}>{formatBookmarksSummary(saved.length, byRecipe ? counts.ready : null)}</Text>
          ) : null}
        </View>

        <SearchField
          label="Search bookmarks"
          placeholder="Search your bookmarks…"
          clearLabel="Clear search"
          value={query}
          onChangeText={setQuery}
        />

        {readiness.status === 'failed' ? <Text style={styles.pantryProblem}>Couldn't check your pantry.</Text> : null}
      </TapAwayToDismiss>

      {byRecipe ? <ReadinessFilterChips selected={filter} counts={counts} onSelect={setFilter} /> : null}

      {load.status === 'loading' ? (
        <TapAwayToDismiss style={styles.loading}>
          <ActivityIndicator accessibilityLabel="Loading bookmarks" color={colors.accent} />
        </TapAwayToDismiss>
      ) : load.status === 'failed' ? (
        <TapAwayToDismiss>
          <StateMessage message="Couldn't load your bookmarks." />
        </TapAwayToDismiss>
      ) : visible.length === 0 ? (
        <TapAwayToDismiss>
          <EmptyState noneSaved={saved.length === 0} onBrowseRecipes={onBrowseRecipes} />
        </TapAwayToDismiss>
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={listContentStyle}
          data={visible}
          {...LIST_WINDOW}
          keyboardShouldPersistTaps="handled"
          keyExtractor={recipeKey}
          renderItem={renderItem}
        />
      )}

      {removed ? (
        <NoticeBar
          message={formatRemovedBookmark(removed.recipe.name)}
          bottom={bottomClearance}
          action={{
            label: 'Undo',
            accessibilityLabel: formatUndoBookmarkLabel(removed.recipe.name),
            onPress: () => undo(removed),
          }}
        />
      ) : failures > 0 ? (
        <NoticeBar message="Couldn't update your bookmark." bottom={bottomClearance} />
      ) : null}
    </View>
  );
}

function EmptyState({ noneSaved, onBrowseRecipes }: { noneSaved: boolean; onBrowseRecipes: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyTile}>
        <Icon name="bookmark" size={30} color={colors.accent} strokeWidth={1.6} />
      </View>
      <Text style={styles.emptyTitle}>{noneSaved ? 'No bookmarks yet' : 'Nothing matches'}</Text>
      <Text style={styles.emptyBody}>
        {noneSaved ? 'Tap the bookmark on any recipe to keep it here for later.' : 'Try a different filter or search.'}
      </Text>
      <PressableScale
        size="button"
        accessibilityRole="button"
        accessibilityLabel="Browse recipes"
        onPress={onBrowseRecipes}
        // Android fades the button as one picture, not its fill and label separately (see AGENTS.md §5.2).
        needsOffscreenAlphaCompositing
        wrapperStyle={styles.browseWrapper}
        style={({ pressed }) => [styles.browse, pressed && styles.pressed]}
      >
        <Text style={styles.browseLabel}>Browse recipes</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: spacing.screenTop, paddingHorizontal: spacing.screen, paddingBottom: spacing.xxs },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  title: { fontFamily: fonts.heading, fontSize: fontSize.screenTitle, color: colors.text },
  // Caveat's slanted letters stick out of their box, and Android clips them there (see AGENTS.md §5.2).
  tagline: { flexShrink: 1, paddingRight: spacing.xs, fontFamily: fonts.handwritten, fontSize: 20, color: colors.accent },
  summary: { marginTop: spacing.xs, fontFamily: fonts.regular, fontSize: fontSize.body, color: colors.textSecondary },
  pantryProblem: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.screen,
    fontFamily: fonts.regular,
    fontSize: fontSize.caption,
    color: colors.accent,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1 },
  listContent: {
    gap: spacing.lg,
    paddingTop: spacing.xxs,
    paddingHorizontal: spacing.screen,
    // The bottom padding, set in the JSX, keeps the last card clear of the dock and the Undo bar.
  },
  empty: { flex: 1, alignItems: 'center', paddingTop: 56, paddingHorizontal: spacing.xxxl },
  emptyTile: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.accentSoft,
  },
  emptyTitle: { marginTop: spacing.xl, fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  emptyBody: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: fontSize.body,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  browseWrapper: { marginTop: 18 },
  browse: { paddingVertical: spacing.md, paddingHorizontal: spacing.xxl, borderRadius: radii.md, backgroundColor: colors.accent },
  pressed: { opacity: 0.85 },
  browseLabel: { fontFamily: fonts.heavy, fontSize: fontSize.body, color: colors.onAccent },
});
