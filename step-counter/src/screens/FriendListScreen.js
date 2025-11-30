import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, Image, TouchableOpacity, 
  SafeAreaView, FlatList, Platform, Alert 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker'; // 사진 업로드용
import { useNavigation } from '@react-navigation/native';
import { getItem } from '../utils/authStorage'; 

const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:8080' 
  : 'http://192.168.219.113:8080';

export default function FriendListScreen() {
  const navigation = useNavigation();
  const [myInfo, setMyInfo] = useState(null);
  const [friendList, setFriendList] = useState([]);
  const [profileImage, setProfileImage] = useState(null); // 내 프로필 사진 상태

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = await getItem('userToken');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      // 1. 내 정보 가져오기
      const userRes = await fetch(`${API_URL}/api/user/info`, { headers });
      const userJson = await userRes.json();
      if (userJson.success) setMyInfo(userJson.data);

      // 2. 친구 목록 가져오기 (API 필요, 지금은 더미 데이터로 대체)
      // const friendRes = await fetch(`${API_URL}/api/friends`, { headers });
      // const friendJson = await friendRes.json();
      // if (friendJson.success) setFriendList(friendJson.data);
      
      // [더미 데이터] 친구 목록 예시
      setFriendList([
        { id: 1, nickname: "장경준", title: "오사카 정복자", message: "얘들아 누가 나 좀 이겨봐~", image: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" },
        { id: 2, nickname: "철수", title: "초보 뚜벅이", message: "오늘도 걷는다", image: null },
      ]);

    } catch (e) {
      console.error(e);
    }
  };

  // 📸 사진 업로드 (이미지 클릭 시)
  const pickImage = async () => {
    // 권한 요청
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('사진첩 접근 권한이 필요합니다!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      // TODO: 서버로 이미지 업로드 API 호출 필요
    }
  };

  // 친구 목록 아이템 렌더링
  const renderFriendItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.friendItem}
      onPress={() => navigation.navigate('FriendProfile', { friend: item })} // 친구 프로필로 이동
    >
      <Image 
        source={{ uri: item.image || "https://cdn-icons-png.flaticon.com/512/847/847969.png" }} 
        style={styles.friendImageSmall} 
      />
      <View style={styles.friendInfo}>
        <View style={styles.friendNameRow}>
            {item.title ? <Text style={styles.friendTitleSmall}>{item.title}</Text> : null}
            <Text style={styles.friendName}>{item.nickname}</Text>
        </View>
        <Text style={styles.friendMessage} numberOfLines={1}>{item.message}</Text>
      </View>
      <Text style={styles.arrowIcon}>{">"}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 10}}>
          <Text style={{fontSize: 24, color: '#A0C4FF'}}>{"<"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* 1. 내 프로필 요약 (사진 클릭 시 업로드) */}
        <View style={styles.myProfileSection}>
            <TouchableOpacity onPress={pickImage} style={styles.myImageWrapper}>
                <Image 
                    source={{ uri: profileImage || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }} 
                    style={styles.myProfileImage} 
                />
                <View style={styles.cameraIconBadge}>
                    <Text>📷</Text>
                </View>
            </TouchableOpacity>
            <Text style={styles.myNickname}>{myInfo?.nickname || "나"}</Text>
        </View>

        <View style={styles.divider} />

        {/* 2. 친구 목록 */}
        <FlatList 
            data={friendList}
            renderItem={renderFriendItem}
            keyExtractor={item => item.id.toString()}
            style={styles.friendList}
            ListEmptyComponent={<Text style={{textAlign:'center', color:'#aaa', marginTop: 20}}>친구가 없습니다.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 10, paddingTop: 10 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 20 },
  
  // 내 프로필 영역
  myProfileSection: { alignItems: 'center', marginVertical: 20 },
  myImageWrapper: { position: 'relative' },
  myProfileImage: { 
      width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee' 
  },
  cameraIconBadge: {
      position: 'absolute', bottom: 0, right: 0, 
      backgroundColor: '#fff', borderRadius: 15, padding: 5, elevation: 3
  },
  myNickname: { fontSize: 22, fontWeight: 'bold', marginTop: 10, color: '#333' },

  divider: { width: '100%', height: 1, backgroundColor: '#eee', marginVertical: 10 },

  // 친구 목록 스타일
  friendList: { width: '100%' },
  friendItem: { 
      flexDirection: 'row', alignItems: 'center', 
      paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' 
  },
  friendImageSmall: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee', marginRight: 15 },
  friendInfo: { flex: 1 },
  friendNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  friendTitleSmall: { fontSize: 10, color: '#4A90E2', marginRight: 6, backgroundColor: '#F0F8FF', paddingHorizontal: 4, borderRadius: 4 },
  friendName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  friendMessage: { fontSize: 13, color: '#888' },
  arrowIcon: { fontSize: 18, color: '#ccc' }
});