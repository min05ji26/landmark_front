import React from 'react';
import { 
  StyleSheet, Text, View, Image, TouchableOpacity, 
  SafeAreaView, ScrollView, TextInput 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function FriendProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  // 친구 목록에서 넘겨준 친구 정보
  const { friend } = route.params; 

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 10}}>
          <Text style={{fontSize: 24, color: '#A0C4FF'}}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>친구 프로필</Text>
        <View style={{width: 30}} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30, alignItems: 'center' }}>
        
        {/* 친구 프로필 카드 (수정 버튼 없음) */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
             <Image 
               source={{ uri: friend.image || "https://cdn-icons-png.flaticon.com/512/847/847969.png" }} 
               style={styles.profileImage} 
             />
          </View>
          
          <View style={styles.titleRow}>
            <Text style={styles.representativeTitle}>
              {friend.title || "칭호 없음"}
            </Text>
          </View>

          <Text style={styles.nickname}>{friend.nickname}</Text>
          <Text style={styles.statusText}>여행 중...</Text>

          <Text style={styles.totalSteps}>
            총 {friend.totalSteps ? friend.totalSteps.toLocaleString() : 0} 걸음
          </Text>
        </View>

        {/* 상태 메시지 (읽기 전용) */}
        <Text style={styles.sectionLabel}>상태메세지</Text>
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>
            {friend.message || "상태 메시지가 없습니다."}
          </Text>
        </View>

        {/* 하단 챗 버튼 (디자인용) */}
        <View style={{marginTop: 30}}>
            <View style={styles.chatButton}>
                <Text style={{fontSize: 24}}>💬</Text>
            </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9FF' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 10, paddingTop: 10, marginBottom: 10 
  },
  headerTitle: { fontSize: 16, color: '#aaa' },
  
  profileCard: {
    backgroundColor: '#fff', borderRadius: 30, alignItems: 'center',
    paddingVertical: 40, paddingHorizontal: 20, marginBottom: 25, width: '100%',
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, elevation: 3
  },
  profileImageContainer: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#E0E0E0',
    marginBottom: 20, overflow: 'hidden', justifyContent: 'center', alignItems: 'center'
  },
  profileImage: { width: '100%', height: '100%' },
  
  titleRow: { marginBottom: 10 },
  representativeTitle: { fontSize: 24, color: '#4A90E2', fontWeight: 'bold' },

  nickname: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  statusText: { fontSize: 13, color: '#aaa', marginBottom: 30 },
  totalSteps: { fontSize: 28, fontWeight: 'bold', color: '#555' },

  sectionLabel: { fontSize: 14, color: '#888', alignSelf: 'flex-start', marginLeft: 10, marginBottom: 8 },
  messageBox: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, width: '100%',
    height: 60, justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 2 }, elevation: 1
  },
  messageText: { fontSize: 15, color: '#333' },

  chatButton: {
      width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff',
      justifyContent: 'center', alignItems: 'center', elevation: 5, shadowOpacity: 0.1
  }
});