import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Pressable, TextInput, 
  KeyboardAvoidingView, Platform, ActivityIndicator, Share, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore, Message } from '@/store/useChatStore';
import { useFriends } from '@/hooks/api/useFriends';
import { useChatSubscription } from '@/hooks/api/useChatSubscription';
import { createInvite } from '@/lib/api';

export default function MessagesScreen() {
  const { accessToken, user } = useAuthStore();
  const { 
    users: friends, 
    loadUsers, 
    isLoading: friendsLoading 
  } = useFriends();
  
  useChatSubscription();

  const {
    activeReceiverId,
    setActiveReceiverId,
    messages,
    sendMessage,
    loadMoreMessages,
    isLoading,
    isLoadingMore,
    hasMoreMessages,
    unreadMessages
  } = useChatStore();

  const [inputMessage, setInputMessage] = useState('');
  
  useEffect(() => {
    if (accessToken) {
      loadUsers(accessToken);
    }
  }, [accessToken, loadUsers]);

  const handleShareInvite = async () => {
    if (!accessToken) return;
    try {
      const res = await createInvite(accessToken);
      if (res && res.token) {
        const link = `https://kiet.xyz/invite/${res.token}`;
        await Share.share({
          message: `Join me on Music App! ${link}`,
        });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to create invite');
    }
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || !accessToken || !activeReceiverId) return;
    try {
      await sendMessage(accessToken, inputMessage.trim());
      setInputMessage('');
    } catch (e) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleLoadMore = () => {
    if (accessToken && hasMoreMessages && !isLoadingMore) {
      loadMoreMessages(accessToken);
    }
  };

  if (!activeReceiverId) {
    // View A: Friend List
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
          <Pressable onPress={handleShareInvite} style={styles.iconButton}>
            <Ionicons name="person-add" size={24} color="#fafafa" />
          </Pressable>
        </View>
        
        {friendsLoading ? (
          <ActivityIndicator size="large" color="#6366f1" style={styles.center} />
        ) : (
          <FlatList
            data={friends}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isUnread = unreadMessages.includes(item.id);
              return (
                <Pressable 
                  style={styles.friendRow} 
                  onPress={() => setActiveReceiverId(item.id, accessToken || undefined)}
                >
                  <View style={styles.avatarContainer}>
                    <Avatar url={item.avatar} fallback={item.name.charAt(0)} size={50} />
                    {item.isOnline && <View style={styles.onlineDot} />}
                  </View>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{item.name}</Text>
                    {item.lastSeen && !item.isOnline && (
                      <Text style={styles.lastSeen}>Last seen: {new Date(item.lastSeen).toLocaleDateString()}</Text>
                    )}
                  </View>
                  {isUnread && <View style={styles.unreadBadge} />}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No friends yet. Send an invite!</Text>
            }
          />
        )}
      </View>
    );
  }

  // View B: Active Chat
  const activeFriend = friends.find(f => f.id === activeReceiverId);
  
  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.chatHeader}>
        <Pressable onPress={() => setActiveReceiverId(null)} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </Pressable>
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderName}>{activeFriend?.name || 'Chat'}</Text>
          {activeFriend?.isOnline && <Text style={styles.onlineText}>Online</Text>}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#6366f1" style={styles.center} />
      ) : (
        <FlatList
          inverted
          data={[...messages].reverse()}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.chatContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isLoadingMore ? <ActivityIndicator color="#6366f1" /> : null}
          renderItem={({ item }) => {
            const isMe = item.senderId === user?.id;
            return (
              <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowThem]}>
                <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleThem]}>
                  <Text style={styles.messageText}>{item.content}</Text>
                  <Text style={styles.messageTime}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor="#a1a1aa"
          value={inputMessage}
          onChangeText={setInputMessage}
          multiline
        />
        <Pressable onPress={handleSend} style={styles.sendButton}>
          <Ionicons name="send" size={20} color="#fafafa" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    backgroundColor: '#18181b',
    borderBottomWidth: 1,
    borderBottomColor: '#3f3f46',
  },
  headerTitle: {
    color: '#fafafa',
    fontSize: 20,
    fontWeight: 'bold',
  },
  iconButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#18181b',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '600',
  },
  lastSeen: {
    color: '#a1a1aa',
    fontSize: 12,
    marginTop: 2,
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  emptyText: {
    color: '#a1a1aa',
    textAlign: 'center',
    marginTop: 40,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    backgroundColor: '#18181b',
    borderBottomWidth: 1,
    borderBottomColor: '#3f3f46',
  },
  chatHeaderInfo: {
    marginLeft: 12,
  },
  chatHeaderName: {
    color: '#fafafa',
    fontSize: 18,
    fontWeight: 'bold',
  },
  onlineText: {
    color: '#22c55e',
    fontSize: 12,
  },
  chatContent: {
    padding: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowThem: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  messageBubbleMe: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  messageBubbleThem: {
    backgroundColor: '#27272a',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: '#fafafa',
    fontSize: 16,
  },
  messageTime: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#18181b',
    borderTopWidth: 1,
    borderTopColor: '#3f3f46',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#27272a',
    color: '#fafafa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    minHeight: 40,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#6366f1',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  }
});
