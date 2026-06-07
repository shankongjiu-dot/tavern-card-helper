/**
 * useCardLibrary - CRUD operations for the character card library.
 * Uses Dexie.js (IndexedDB) for persistence.
 */
import { useState, useEffect, useCallback } from 'react';
import { db } from '../db/database';
import { assembleCard } from '../services/card-exporter';

interface CardRecord {
  id?: number;
  name: string;
  spec: string;
  spec_version: string;
  data: Record<string, unknown>;
  _meta: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

export function useCardLibrary() {
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [loading, setLoading] = useState(true);

  /** Load all cards from IndexedDB */
  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const all = await db.cards.orderBy('updatedAt').reverse().toArray();
      setCards(all as CardRecord[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  /** Save a card (create or update) */
  const saveCard = useCallback(async (draft: Parameters<typeof assembleCard>[0], existingId?: number) => {
    const card = assembleCard(draft, existingId);
    if (existingId) {
      card.createdAt = ((await db.cards.get(existingId)) as CardRecord)?.createdAt || new Date();
    }
    const id = await db.cards.put(card);
    await loadCards();
    return id;
  }, [loadCards]);

  /** Get a card by ID */
  const getCard = useCallback(async (id: number): Promise<CardRecord | undefined> => {
    return (await db.cards.get(id)) as CardRecord | undefined;
  }, []);

  /** Delete a card by ID */
  const deleteCard = useCallback(async (id: number) => {
    await db.cards.delete(id);
    // Also delete associated chat sessions
    await db.chat_sessions.where('cardId').equals(id).delete();
    await loadCards();
  }, [loadCards]);

  /** Search cards by name */
  const searchCards = useCallback(async (query: string) => {
    const all = await db.cards.toArray();
    const filtered = all.filter((c: { name: string }) =>
      c.name.toLowerCase().includes(query.toLowerCase())
    );
    return filtered as CardRecord[];
  }, []);

  return { cards, loading, saveCard, getCard, deleteCard, searchCards, loadCards };
}
