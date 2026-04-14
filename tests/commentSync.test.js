/**
 * Cross-device comment sync test
 * Simulates two devices each adding their own comments, then verifies
 * that the sync/merge logic correctly combines them.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  mergeRecipes,
  mergeComments,
  normalizeForCompare,
  recipesEqual,
} from '../src/lib/tencentSync';

function toMillis(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

describe('Comment sync', () => {
  describe('mergeComments', () => {
    it('returns empty array when both inputs are empty', () => {
      const result = mergeComments([], []);
      expect(result).toEqual([]);
    });

    it('merges two unique comments from different devices', () => {
      const deviceA = [
        { id: 'c1', text: 'Made this!', author: 'Little B', createdAt: '2024-01-01T10:00:00Z' },
      ];
      const deviceB = [
        { id: 'c2', text: 'Delicious!', author: 'Little Pan', createdAt: '2024-01-01T12:00:00Z' },
      ];

      const merged = mergeComments(deviceA, deviceB);

      expect(merged).toHaveLength(2);
      const ids = merged.map(c => c.id);
      expect(ids).toContain('c1');
      expect(ids).toContain('c2');
    });

    it('does not duplicate comments with same id from both devices', () => {
      const deviceA = [
        { id: 'c1', text: 'Made this!', author: 'Little B', createdAt: '2024-01-01T10:00:00Z' },
      ];
      const deviceB = [
        { id: 'c1', text: 'Made this!', author: 'Little B', createdAt: '2024-01-01T10:00:00Z' }, // same comment
      ];

      const merged = mergeComments(deviceA, deviceB);
      expect(merged).toHaveLength(1);
    });

    it('takes the newer comment when same id appears on both devices', () => {
      const deviceA = [
        { id: 'c1', text: 'Original text', author: 'Little B', createdAt: '2024-01-01T10:00:00Z' },
      ];
      const deviceB = [
        { id: 'c1', text: 'Updated text', author: 'Little B', createdAt: '2024-01-01T11:00:00Z' },
      ];

      const merged = mergeComments(deviceA, deviceB);
      expect(merged).toHaveLength(1);
      expect(merged[0].text).toBe('Updated text');
    });

    it('handles numeric timestamps (Date.now())', () => {
      const tsA = Date.now() - 10000;
      const tsB = Date.now();
      const deviceA = [{ id: 'c1', text: 'A', author: 'B', createdAt: tsA }];
      const deviceB = [{ id: 'c2', text: 'B', author: 'P', createdAt: tsB }];

      const merged = mergeComments(deviceA, deviceB);
      expect(merged).toHaveLength(2);
    });

    it('sorts merged comments by createdAt ascending (oldest first)', () => {
      const deviceA = [
        { id: 'c2', text: 'Second', author: 'B', createdAt: '2024-01-02T00:00:00Z' },
      ];
      const deviceB = [
        { id: 'c1', text: 'First', author: 'P', createdAt: '2024-01-01T00:00:00Z' },
      ];

      const merged = mergeComments(deviceA, deviceB);
      expect(merged[0].id).toBe('c1');
      expect(merged[1].id).toBe('c2');
    });
  });

  describe('mergeRecipes', () => {
    it('merges comments from two recipes that each have unique comments', () => {
      const recipeA = {
        id: 'r1',
        title: 'Pasta',
        comments: [
          { id: 'c1', text: 'A comment from device A', author: 'Little B', createdAt: '2024-01-01T10:00:00Z' },
        ],
        updatedAt: '2024-01-01T10:00:00Z',
      };
      const recipeB = {
        id: 'r1',
        title: 'Pasta',
        comments: [
          { id: 'c2', text: 'A comment from device B', author: 'Little Pan', createdAt: '2024-01-01T12:00:00Z' },
        ],
        updatedAt: '2024-01-01T12:00:00Z',
      };

      // Simulate device B being newer (local updatedAt >= cloud updatedAt)
      const merged = mergeRecipes(recipeA, recipeB);

      expect(merged.comments).toHaveLength(2);
      const ids = merged.comments.map(c => c.id);
      expect(ids).toContain('c1');
      expect(ids).toContain('c2');
    });

    it('carries over translations from both recipes', () => {
      const recipeA = {
        id: 'r1',
        title: 'Pasta',
        translations: { ja: { title: 'パスタ' } },
        updatedAt: '2024-01-01T10:00:00Z',
      };
      const recipeB = {
        id: 'r1',
        title: 'Pasta',
        translations: { fr: { title: 'Pâtes' } },
        updatedAt: '2024-01-01T12:00:00Z',
      };

      const merged = mergeRecipes(recipeA, recipeB);

      expect(merged.translations).toHaveProperty('ja');
      expect(merged.translations).toHaveProperty('fr');
    });
  });

  describe('normalizeForCompare', () => {
    it('normalizes comment timestamps to milliseconds', () => {
      const recipe = {
        comments: [
          { id: 'c1', text: 'Test', author: 'B', createdAt: '2024-01-01T10:00:00Z' },
          { id: 'c2', text: 'Test2', author: 'P', createdAt: Date.now() }, // numeric
        ],
      };

      const normalized = normalizeForCompare(recipe);

      expect(typeof normalized.comments[0].createdAt).toBe('number');
      expect(typeof normalized.comments[1].createdAt).toBe('number');
    });

    it('sorts comments consistently by id', () => {
      const recipe = {
        comments: [
          { id: 'z-comment', text: 'Last', author: 'B', createdAt: '2024-01-03T00:00:00Z' },
          { id: 'a-comment', text: 'First', author: 'P', createdAt: '2024-01-01T00:00:00Z' },
        ],
      };

      const normalized = normalizeForCompare(recipe);
      expect(normalized.comments[0].id).toBe('a-comment');
      expect(normalized.comments[1].id).toBe('z-comment');
    });
  });

  describe('recipesEqual', () => {
    it('returns true for identical recipes with same comments', () => {
      const recipe1 = {
        id: 'r1',
        title: 'Pasta',
        comments: [{ id: 'c1', text: 'Great!', author: 'B', createdAt: '2024-01-01T10:00:00Z' }],
        updatedAt: '2024-01-01T10:00:00Z',
      };
      const recipe2 = {
        id: 'r1',
        title: 'Pasta',
        comments: [{ id: 'c1', text: 'Great!', author: 'B', createdAt: '2024-01-01T10:00:00Z' }],
        updatedAt: '2024-01-01T10:00:00Z',
      };

      expect(recipesEqual(recipe1, recipe2)).toBe(true);
    });

    it('returns false when one recipe has extra comments', () => {
      const recipe1 = {
        id: 'r1',
        title: 'Pasta',
        comments: [{ id: 'c1', text: 'Great!', author: 'B', createdAt: '2024-01-01T10:00:00Z' }],
        updatedAt: '2024-01-01T10:00:00Z',
      };
      const recipe2 = {
        id: 'r1',
        title: 'Pasta',
        comments: [
          { id: 'c1', text: 'Great!', author: 'B', createdAt: '2024-01-01T10:00:00Z' },
          { id: 'c2', text: 'Another', author: 'P', createdAt: '2024-01-01T12:00:00Z' },
        ],
        updatedAt: '2024-01-01T12:00:00Z',
      };

      expect(recipesEqual(recipe1, recipe2)).toBe(false);
    });

    it('ignores timestamp format differences after normalization', () => {
      const recipe1 = {
        id: 'r1',
        title: 'Pasta',
        comments: [{ id: 'c1', text: 'Great!', author: 'B', createdAt: '2024-01-01T10:00:00Z' }],
        updatedAt: '2024-01-01T10:00:00Z',
      };
      const recipe2 = {
        id: 'r1',
        title: 'Pasta',
        comments: [{ id: 'c1', text: 'Great!', author: 'B', createdAt: toMillis('2024-01-01T10:00:00Z') }],
        updatedAt: toMillis('2024-01-01T10:00:00Z'),
      };

      expect(recipesEqual(recipe1, recipe2)).toBe(true);
    });
  });

  describe('cross-device scenario', () => {
    it('two devices add comments independently → both appear after merge', () => {
      // Base recipe on cloud (no comments yet)
      const baseRecipe = {
        id: 'r1',
        title: 'Risotto',
        ingredients: ['Rice', 'Broth'],
        instructions: 'Stir.',
        comments: [],
        updatedAt: '2024-01-01T09:00:00Z',
      };

      // Device A adds a comment (cloud has been updated by Device A)
      const cloudAfterDeviceA = {
        ...baseRecipe,
        comments: [
          { id: 'c-a1', text: 'Perfect base!', author: 'Little B', createdAt: '2024-01-01T10:00:00Z' },
        ],
        updatedAt: '2024-01-01T10:00:00Z',
      };

      // Device B is offline, has old copy (no comments) and adds their own comment
      const localDeviceB = {
        ...baseRecipe, // stale — no comments yet
        comments: [
          { id: 'c-b1', text: 'Yummy!', author: 'Little Pan', createdAt: '2024-01-01T11:00:00Z' },
        ],
        updatedAt: '2024-01-01T11:00:00Z',
      };

      // When Device B comes online, merge: cloud (has Device A's comment)
      // vs local (has Device B's comment). Local is newer, so it wins,
      // but both comments should be present.
      const merged = mergeRecipes(cloudAfterDeviceA, localDeviceB);

      const commentIds = merged.comments.map(c => c.id);

      // Both Device A and Device B's comments should survive the merge
      expect(commentIds).toContain('c-a1');
      expect(commentIds).toContain('c-b1');
    });

    it('concurrent edits on same recipe (different fields + comments) are preserved', () => {
      // Cloud state
      const cloud = {
        id: 'r1',
        title: 'Risotto',
        language: 'en',
        comments: [{ id: 'c-cloud', text: 'From cloud', author: 'Cloud', createdAt: '2024-01-01T09:00:00Z' }],
        updatedAt: '2024-01-01T09:00:00Z',
      };

      // Device adds a translation (different field) and its own comment
      const local = {
        id: 'r1',
        title: 'Risotto',
        language: 'en',
        translations: { ja: { title: 'リゾット' } }, // new field
        comments: [
          { id: 'c-local', text: 'From device', author: 'Device', createdAt: '2024-01-01T10:00:00Z' },
        ],
        updatedAt: '2024-01-01T10:00:00Z',
      };

      const merged = mergeRecipes(cloud, local);

      // Both comments survived
      expect(merged.comments.map(c => c.id)).toContain('c-cloud');
      expect(merged.comments.map(c => c.id)).toContain('c-local');

      // Translation also survived
      expect(merged.translations).toHaveProperty('ja');
    });
  });
});