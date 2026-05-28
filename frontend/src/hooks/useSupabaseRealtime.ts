import { useEffect, useRef } from 'react';
import { supabase, isConfigured } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Hook to subscribe to real-time changes in a Supabase table.
 * 
 * @param table - The name of the table to subscribe to.
 * @param callback - Function to handle the change payload.
 */
export function useSupabaseRealtime<T extends { [key: string]: any }>(
  table: string,
  callback: (payload: RealtimePostgresChangesPayload<T>) => void
) {
  // Use a ref for the callback to avoid re-subscribing when callback changes
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!table || !isConfigured || !supabase) return;

    let channel: ReturnType<typeof supabase.channel>;

    try {
      // Create a unique channel name based on table and a timestamp/random string 
      // to avoid reusing a channel that is currently being unsubscribed
      const channelName = `realtime:${table}:${Math.random().toString(36).substring(7)}`;
      
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
          },
          (payload) => {
            callbackRef.current(payload as RealtimePostgresChangesPayload<T>);
          }
        );
        
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to ${table} changes`);
        }
      });

      return () => {
        if (supabase && channel) {
           // Cleanup by completely removing the channel
           supabase.removeChannel(channel).catch(console.error);
        }
      };
    } catch (err) {
      console.error(`Supabase subscription error for table ${table}:`, err);
    }
  }, [table]); // Only re-subscribe if table name changes
}
