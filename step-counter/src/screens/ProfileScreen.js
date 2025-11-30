import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, Image, TouchableOpacity, 
  SafeAreaView, Platform, ScrollView, Alert, TextInput, Modal, FlatList 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker'; 
import { useNavigation } from '@react-navigation/native';

import { getItem } from '../utils/authStorage'; 
import { API_URL } from '../constants/constants';

const TITLES_PER_PAGE = 5;

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // 칭호 모달 상태
  const [modalVisible, setModalVisible] = useState(false);
  const [ownedTitles, setOwnedTitles] = useState([]);
  const [titlePage, setTitlePage] = useState(1);

  // 닉네임 변경 모달 상태
  const [nickModalVisible, setNickModalVisible] = useState(false);
  const [newNickname, setNewNickname] = useState("");

  // 🚨 [추가] 상태 메시지 관련 상태
  const [statusMsg, setStatusMsg] = useState("");
  const [isEditingMsg, setIsEditingMsg] = useState(false);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = await getItem('userToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/user/info`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const json = await response.json();
      if (json.success) {
        setUserInfo(json.data);
        // 서버에서 가져온 상태메시지 세팅 (없으면 빈값)
        setStatusMsg(json.data.statusMessage || "");
      }
    } catch (error) {
      console.error("내 정보 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🚨 [추가] 상태 메시지 저장 함수
  const handleUpdateStatusMessage = async () => {
    try {
        const token = await getItem('userToken');
        const response = await fetch(`${API_URL}/api/user/status-message`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ message: statusMsg })
        });
        const json = await response.json();

        if (json.success) {
            setUserInfo({ ...userInfo, statusMessage: statusMsg });
            setIsEditingMsg(false); // 수정 모드 종료
            Alert.alert("성공", "상태 메시지가 저장되었습니다.");
        } else {
            Alert.alert("실패", json.message);
        }
    } catch (e) {
        console.error(e);
        Alert.alert("오류", "서버 통신 실패");
    }
  };

  // 기존 프로필 사진 변경 함수
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 부족', '사진첩 접근 권한이 필요합니다.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true,
    });
    if (!result.canceled) {
      const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
      updateProfileImageOnServer(base64Img);
    }
  };

  const updateProfileImageOnServer = async (base64Img) => {
    try {
        const token = await getItem('userToken');
        const response = await fetch(`${API_URL}/api/user/image`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ imageUrl: base64Img })
        });
        const json = await response.json();
        if (json.success) {
            setUserInfo({ ...userInfo, profileImageUrl: base64Img });
            Alert.alert("성공", "프로필 사진이 변경되었습니다!");
        } else { Alert.alert("실패", "사진 용량이 너무 큽니다."); }
    } catch (e) { console.error(e); }
  };

  // 닉네임 변경 함수
  const handleUpdateNickname = async () => {
    if (!newNickname.trim()) { Alert.alert("알림", "닉네임을 입력해주세요."); return; }
    try {
        const token = await getItem('userToken');
        const response = await fetch(`${API_URL}/api/user/nickname`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ nickname: newNickname })
        });
        const json = await response.json();
        if (json.success) {
            setUserInfo({ ...userInfo, nickname: newNickname });
            setNickModalVisible(false); setNewNickname("");
            Alert.alert("성공", "닉네임이 변경되었습니다.");
        } else { Alert.alert("실패", json.message); }
    } catch (e) { console.error(e); }
  };

  // 칭호 관련 함수
  const handleOpenTitleModal = async () => {
    try {
        const token = await getItem('userToken');
        const response = await fetch(`${API_URL}/api/user/titles`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const json = await response.json();
        if (json.success) {
            setOwnedTitles(json.data); setTitlePage(1); setModalVisible(true);
        }
    } catch (e) { console.error(e); }
  };

  const handleSelectTitle = async (title) => {
    try {
        const token = await getItem('userToken');
        const response = await fetch(`${API_URL}/api/user/title`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ title: title })
        });
        const json = await response.json();
        if (json.success) {
            setUserInfo({ ...userInfo, representativeTitle: title });
            setModalVisible(false);
            if(Platform.OS !== 'web') Alert.alert("알림", `칭호가 변경되었습니다 '${title}'`);
            else alert(`칭호가 변경되었습니다 '${title}'`);
        } else { Alert.alert("실패", json.message); }
    } catch (e) { console.error(e); }
  };

  const totalTitlePages = Math.ceil(ownedTitles.length / TITLES_PER_PAGE);
  const displayedTitles = ownedTitles.slice((titlePage - 1) * TITLES_PER_PAGE, titlePage * TITLES_PER_PAGE);

  if (loading) {
    return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><Text>로딩 중...</Text></View>;
  }

  const currentTitle = userInfo?.representativeTitle || "칭호 없음";
  const profileImgSource = userInfo?.profileImageUrl 
    ? { uri: userInfo.profileImageUrl } 
    : { uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 10}}>
          <Text style={{fontSize: 24, color: '#A0C4FF'}}>{"<"}</Text>
        </TouchableOpacity>
        <View style={{width: 30}} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}>
        
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={pickImage} style={styles.profileImageContainer}>
             <Image source={profileImgSource} style={styles.profileImage} />
             <View style={styles.cameraBadge}><Text style={{fontSize: 12}}>📷</Text></View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.titleRow} onPress={handleOpenTitleModal}>
            <Text style={[
                styles.representativeTitle, 
                !userInfo?.representativeTitle && { color: '#aaa', fontWeight: 'normal' }
            ]}>
              {currentTitle}
            </Text>
            <Text style={styles.titleArrow}> {">"} </Text>
          </TouchableOpacity>

          <View style={styles.nicknameRow}>
            <Text style={styles.nickname}>{userInfo?.nickname}</Text>
            <TouchableOpacity style={styles.changeNameButton} onPress={() => setNickModalVisible(true)}>
                <Text style={styles.changeNameText}>이름 변경</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.statusText}>여행 중...</Text>

          <Text style={styles.totalSteps}>
            총 {userInfo?.totalSteps ? userInfo.totalSteps.toLocaleString() : 0} 걸음
          </Text>
        </View>

        <Text style={styles.sectionLabel}>상태메세지</Text>
        {/* 🚨 [수정] 상태 메시지 입력창 + 수정 버튼 */}
        <View style={styles.messageBoxRow}>
          <TextInput 
            style={styles.messageInputFlex}
            placeholder="상태 메시지를 입력해주세요."
            placeholderTextColor="#ccc"
            value={statusMsg}
            onChangeText={setStatusMsg}
            editable={isEditingMsg} // 수정 모드일 때만 입력 가능
          />
          
          <TouchableOpacity 
            style={styles.editMsgButton}
            onPress={() => {
                if (isEditingMsg) {
                    // 저장 버튼 눌렀을 때
                    handleUpdateStatusMessage();
                } else {
                    // 수정 버튼 눌렀을 때
                    setIsEditingMsg(true);
                }
            }}
          >
            <Text style={styles.editMsgButtonText}>
                {isEditingMsg ? "저장" : "수정"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.friendButton} onPress={() => navigation.navigate('FriendList')}>
          <View style={styles.friendIconBox}><Text style={{fontSize: 20}}>👥</Text></View>
          <Text style={styles.friendButtonText}>친구</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* 칭호 모달 */}
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalCurrentTitle}>{currentTitle}</Text>
            <View style={styles.divider} />
            {displayedTitles.length > 0 ? (
                displayedTitles.map((item, index) => (
                    <View key={index} style={styles.titleRowItem}>
                        <Text style={styles.titleListText}>{item}</Text>
                        <TouchableOpacity style={styles.selectButton} onPress={() => handleSelectTitle(item)}>
                            <Text style={styles.selectButtonText}>선택</Text>
                        </TouchableOpacity>
                    </View>
                ))
            ) : <Text style={{textAlign:'center', color:'#aaa', marginVertical:20}}>획득한 칭호가 없습니다.</Text>}
            {ownedTitles.length > 0 && (
                <View style={styles.modalPagination}>
                    {Array.from({ length: totalTitlePages }, (_, i) => i + 1).map((page) => (
                        <TouchableOpacity key={page} onPress={() => setTitlePage(page)} style={{ padding: 10 }}>
                            <Text style={[styles.pageNumber, titlePage === page && styles.activePageNumber]}>{page}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
            <TouchableOpacity style={{marginTop: 10}} onPress={() => setModalVisible(false)}><Text style={{color:'#ccc'}}>닫기</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 닉네임 모달 */}
      <Modal animationType="slide" transparent={true} visible={nickModalVisible} onRequestClose={() => setNickModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentSmall}>
            <Text style={styles.modalTitle}>닉네임 변경</Text>
            <TextInput 
                style={styles.nickInput} placeholder="새로운 닉네임 입력" value={newNickname} onChangeText={setNewNickname} maxLength={10}
            />
            <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setNickModalVisible(false)}><Text style={styles.cancelText}>취소</Text></TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleUpdateNickname}><Text style={styles.confirmText}>변경</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9FF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingTop: 10, marginBottom: 10 },
  
  profileCard: {
    backgroundColor: '#fff', borderRadius: 30, alignItems: 'center',
    paddingVertical: 40, paddingHorizontal: 20, marginBottom: 25,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 3
  },
  profileImageContainer: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#E0E0E0',
    marginBottom: 20, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', position: 'relative'
  },
  profileImage: { width: '100%', height: '100%' },
  cameraBadge: { position: 'absolute', bottom: 5, right: 10, backgroundColor: '#fff', borderRadius: 12, padding: 4, elevation: 2 },
  
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  representativeTitle: { fontSize: 24, color: '#4A90E2', fontWeight: 'bold' }, 
  titleArrow: { fontSize: 18, color: '#ccc' },

  nicknameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  nickname: { fontSize: 22, fontWeight: 'bold', color: '#333', marginRight: 8 },
  changeNameButton: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  changeNameText: { fontSize: 11, color: '#666' },

  statusText: { fontSize: 13, color: '#aaa', marginBottom: 30 },
  totalSteps: { fontSize: 28, fontWeight: 'bold', color: '#555' },

  sectionLabel: { fontSize: 14, color: '#888', marginLeft: 10, marginBottom: 8 },
  
  // 🚨 [수정] 상태 메시지 박스 (Row 레이아웃)
  messageBoxRow: {
    backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 20, marginBottom: 20,
    height: 60, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 2 }, elevation: 1
  },
  messageInputFlex: { flex: 1, fontSize: 15, color: '#333' },
  editMsgButton: { 
      backgroundColor: '#f5f5f5', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, marginLeft: 10
  },
  editMsgButtonText: { fontSize: 13, color: '#555', fontWeight: '600' },

  friendButton: {
    backgroundColor: '#fff', borderRadius: 25, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, height: 60, shadowColor: '#000', shadowOpacity: 0.03, elevation: 1
  },
  friendIconBox: { width: 40, height: 40, backgroundColor: '#F0F8FF', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  friendButtonText: { fontSize: 16, fontWeight: '600', color: '#333' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: 'white', borderRadius: 30, padding: 25, alignItems: 'center', elevation: 10, minHeight: 400 },
  modalCurrentTitle: { fontSize: 28, fontWeight: 'bold', color: '#4A90E2', marginBottom: 20, textAlign: 'center' },
  divider: { width: '100%', height: 1, backgroundColor: '#E0E0E0', marginBottom: 10 },
  titleRowItem: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  titleListText: { fontSize: 16, color: '#333' },
  selectButton: { backgroundColor: '#F5F6F8', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  selectButtonText: { fontSize: 12, color: '#555', fontWeight: '600' },
  modalPagination: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  pageNumber: { fontSize: 16, color: '#ccc', marginHorizontal: 5 },
  activePageNumber: { color: '#333', fontWeight: 'bold', textDecorationLine: 'underline' },

  modalContentSmall: { width: '80%', backgroundColor: 'white', borderRadius: 20, padding: 20, alignItems: 'center', elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  nickInput: { width: '100%', borderBottomWidth: 1, borderColor: '#ddd', padding: 10, fontSize: 16, marginBottom: 20 },
  modalBtnRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  cancelBtn: { flex: 1, padding: 10, alignItems: 'center', marginRight: 5, backgroundColor: '#f0f0f0', borderRadius: 8 },
  confirmBtn: { flex: 1, padding: 10, alignItems: 'center', marginLeft: 5, backgroundColor: '#4A90E2', borderRadius: 8 },
  cancelText: { color: '#666' },
  confirmText: { color: 'white', fontWeight: 'bold' },
});