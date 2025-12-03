import React from 'react';
import { 
  StyleSheet, Text, View, Image, TouchableOpacity, 
  SafeAreaView, ScrollView, Alert, Platform 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getItem } from '../utils/authStorage'; 
import { API_URL } from '../constants/constants';

export default function FriendProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { friend } = route.params; 

  // ✅ [수정] 친구 삭제 로직 (메시지 문구 반영 및 웹 호환성 추가)
  const handleDeleteFriend = async () => {
    const confirmMessage = `${friend.friendNickname}님을 친구 목록에서 삭제하시겠습니까?`;
    
    if (Platform.OS === 'web') {
        if (window.confirm(confirmMessage)) {
            performDelete();
        }
    } else {
        Alert.alert(
            "친구 삭제", 
            confirmMessage,
            [
                { text: "취소", style: "cancel" },
                { 
                    text: "삭제", 
                    style: "destructive", 
                    onPress: performDelete
                }
            ]
        );
    }
  };

  const performDelete = async () => {
    try {
        const token = await getItem('userToken');
        const response = await fetch(`${API_URL}/api/friends/${friend.friendNickname}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        const json = await response.json();
        
        if (json.success) {
            const successMessage = `${friend.friendNickname}님이 친구목록에서 삭제되었습니다`;
            
            if (Platform.OS === 'web') {
                window.alert(successMessage);
                navigation.goBack();
            } else {
                Alert.alert("삭제 완료", successMessage, [
                    { text: "확인", onPress: () => navigation.goBack() }
                ]);
            }
        } else { 
            const failMessage = json.message || "삭제 실패";
            Platform.OS === 'web' ? window.alert(failMessage) : Alert.alert("실패", failMessage);
        }
    } catch (e) { 
        console.error(e);
        const errMsg = "서버 통신 오류";
        Platform.OS === 'web' ? window.alert(errMsg) : Alert.alert("오류", errMsg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 10}}>
          <Text style={{fontSize: 24, color: '#A0C4FF'}}>{"<"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30, alignItems: 'center' }}>
        
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
             <Image 
               source={{ uri: friend.profileImageUrl || "https://cdn-icons-png.flaticon.com/512/847/847969.png" }} 
               style={styles.profileImage} 
             />
          </View>
          <View style={styles.titleRow}>
            <Text style={styles.representativeTitle}>
                {friend.representativeTitle || "칭호 없음"}
            </Text> 
          </View>
          <Text style={styles.nickname}>{friend.friendNickname}</Text>
          
          <Text style={styles.statusText}>
            {friend.currentLandmark ? `${friend.currentLandmark} 여행 중...` : "여행 준비 중..."}
          </Text>
          
          <Text style={styles.totalSteps}>
            총 {friend.totalSteps ? friend.totalSteps.toLocaleString() : 0} 걸음
          </Text> 
        </View>

        <Text style={styles.sectionLabel}>상태메세지</Text>
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>
            {friend.statusMessage || "상태 메시지가 없습니다."}
          </Text>
        </View>

        <View style={{marginTop: 50}}>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteFriend}>
                <Text style={styles.deleteButtonText}>삭제</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9FF' },
  header: { paddingHorizontal: 10, paddingTop: 10, alignItems: 'flex-start' },
  
  profileCard: {
    backgroundColor: '#fff', borderRadius: 30, alignItems: 'center',
    paddingVertical: 40, paddingHorizontal: 20, marginBottom: 25, width: '100%',
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, elevation: 3
  },
  profileImageContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E0E0E0', marginBottom: 20, overflow: 'hidden' },
  profileImage: { width: '100%', height: '100%' },
  titleRow: { marginBottom: 10 },
  representativeTitle: { fontSize: 24, color: '#4A90E2', fontWeight: 'bold' },
  nickname: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  statusText: { fontSize: 13, color: '#aaa', marginBottom: 30 },
  totalSteps: { fontSize: 28, fontWeight: 'bold', color: '#555' },
  sectionLabel: { fontSize: 14, color: '#888', alignSelf: 'flex-start', marginLeft: 10, marginBottom: 8 },
  messageBox: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, width: '100%',
    height: 60, justifyContent: 'center', elevation: 1
  },
  messageText: { fontSize: 15, color: '#333' },
  deleteButton: {
      backgroundColor: '#fff', borderWidth: 1, borderColor: '#ffcdd2',
      borderRadius: 15, paddingHorizontal: 30, paddingVertical: 10, elevation: 2
  },
  deleteButtonText: { color: '#ef5350', fontWeight: 'bold', fontSize: 15 }
});