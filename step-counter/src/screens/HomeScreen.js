import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, RefreshControl, Alert, Platform 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

// 🚨 utils 경로 확인
import { getItem, deleteItem } from '../utils/authStorage'; 

// 🚨 constants 경로 확인 (파일 위치에 따라 '../constants' 또는 '../constants/constants' 로 수정 필요)
import { API_URL } from '../constants/constants';

export default function HomeScreen({ navigation, stepCount, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [todayDate, setTodayDate] = useState("");
  const [nickname, setNickname] = useState("");
  const [serverTotalSteps, setServerTotalSteps] = useState(0);
  const [representativeTitle, setRepresentativeTitle] = useState("");
  const [myRank, setMyRank] = useState(0);

  const [targetLandmark, setTargetLandmark] = useState("");
  const [goalSteps, setGoalSteps] = useState(0);
  const [currentLocation, setCurrentLocation] = useState("");

  const displayTotalSteps = serverTotalSteps + (stepCount || 0);
  const remainingSteps = Math.max(0, goalSteps - displayTotalSteps);

  useEffect(() => {
    const now = new Date();
    setTodayDate(`${now.getMonth() + 1}월 ${now.getDate()}일`);
    fetchHomeData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHomeData();
    }, [])
  );

  const fetchHomeData = async () => {
    try {
      const token = await getItem('userToken');
      if (!token) {
        if(onLogout) onLogout(); 
        return;
      }

      const response = await fetch(`${API_URL}/api/home`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.status === 401) {
        Alert.alert("인증 만료", "다시 로그인 해주세요.");
        await deleteItem('userToken');
        if(onLogout) onLogout();
        return;
      }

      const jsonData = await response.json();

      if (jsonData.success) {
        const homeData = jsonData.data;
        setNickname(homeData.userInfo.nickname);
        setServerTotalSteps(homeData.userInfo.totalSteps);
        setRepresentativeTitle(homeData.userInfo.representativeTitle);
        setMyRank(homeData.rankingInfo.rank);
        setTargetLandmark(homeData.landmarkInfo.name);
        setGoalSteps(homeData.landmarkInfo.requiredSteps);
        setCurrentLocation(homeData.currentLocationName);
      }
    } catch (error) {
      console.error("통신 에러:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 웹 테스트용 강제 걸음 추가 함수
  const addTestSteps = async () => {
    try {
      const token = await getItem('userToken');
      await fetch(`${API_URL}/api/steps/sync`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ steps: 500 }) 
      });
      alert("테스트: 500보 추가됨! (새로고침 하세요)");
      fetchHomeData(); 
    } catch (e) {
      console.error(e);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  const handleLogoutPress = () => {
    if (Platform.OS === 'web') {
      const isConfirmed = window.confirm("정말 로그아웃 하시겠습니까?");
      if (isConfirmed) {
        deleteItem('userToken').then(() => {
          if (onLogout) onLogout();
        });
      }
      return;
    }
    Alert.alert(
      "로그아웃", "정말 로그아웃 하시겠습니까?",
      [{ text: "취소", style: "cancel" }, { text: "확인", style: 'destructive', onPress: async () => { await deleteItem('userToken'); if (onLogout) onLogout(); } }]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{fontSize: 40}}>🐧</Text>
        <Text style={{color:'#6D6D6D', marginTop:10}}>데이터 가져오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.headerSection}>
          <View style={{flex: 1}}>
            <Text style={styles.dateText}>{todayDate}</Text>
            <Text style={styles.greetingText}>오늘 {nickname}님의 걸음 수예요</Text>
            <View style={styles.stepsWrapper}>
              <Text style={styles.stepsPrefix}>총</Text>
              <Text style={styles.stepsCount}>{displayTotalSteps.toLocaleString()} 걸음</Text>
            </View>
            <Text style={styles.goalText}>
               {remainingSteps > 0 
                 ? `${targetLandmark} 달성까지 ${remainingSteps.toLocaleString()}보 남았어요`
                 : `축하합니다! ${targetLandmark}에 도착했어요! 🎉`}
            </Text>
          </View>
          <View style={styles.penguinImageContainer}>
             <Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/3069/3069172.png" }} style={styles.penguinImage} />
          </View>
        </View>

        {/* 웹 환경일 때만 보이는 테스트 버튼 */}
        {Platform.OS === 'web' && (
            <TouchableOpacity 
                style={{backgroundColor: '#FFEB3B', padding: 15, borderRadius: 10, marginBottom: 20, alignItems:'center'}}
                onPress={addTestSteps}
            >
                <Text style={{fontWeight: 'bold', color: '#333'}}>🚧 TEST: 걸음 수 500보 추가하기</Text>
            </TouchableOpacity>
        )}

        <View style={styles.menuCard}>
          <MenuItem 
            title="랜드마크" 
            desc={`현재: ${currentLocation}`} 
            iconPlaceholder="🏯"
            isLandmark={true}
            onClick={() => navigation.navigate('Landmark')} 
          />
          <MenuItem 
            title="랭킹" 
            desc={myRank > 0 ? `${myRank}위` : "-"} 
            iconPlaceholder="🥈"
            onClick={() => navigation.navigate('Ranking')} 
          />
          <MenuItem 
            title="업적" 
            desc="" 
            iconPlaceholder="🏆"
            onClick={() => Alert.alert("알림", "아직 준비중입니다! 🚧")} 
          />
        </View>

        <BottomButton 
            title="내 프로필" 
            iconPlaceholder="👤" 
            onClick={() => navigation.navigate('Profile')} 
        />
        
        {/* 🚨 [수정] 친구 목록 화면으로 연결 */}
        <BottomButton 
            title="친구" 
            iconPlaceholder="👥" 
            onClick={() => navigation.navigate('FriendList')} 
        />
        
        <TouchableOpacity style={[styles.bottomButton, styles.logoutButton]} onPress={handleLogoutPress}>
           <View style={[styles.iconBox, styles.logoutIconBox]}>
             <Text style={{fontSize: 20}}>🚪</Text>
           </View>
           <Text style={[styles.menuTitle, {color: '#d32f2f'}]}>로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function MenuItem({ title, desc, iconPlaceholder, iconSource, isLandmark, onClick }) {
  const shouldHideDesc = !desc; 
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onClick} activeOpacity={0.7}>
      <View style={styles.iconBox}>
        {iconSource ? (
           <Image source={iconSource} style={[styles.iconImage, isLandmark && styles.landmarkTransform]} />
        ) : (
           <Text style={[styles.iconText, isLandmark && styles.landmarkTransform]}>{iconPlaceholder}</Text>
        )}
      </View>
      <View style={styles.textBox}>
        <Text style={styles.menuTitle}>{title}</Text>
        {!shouldHideDesc ? (
           <Text style={styles.menuDesc}>{desc}</Text>
        ) : (
           title !== "업적" && <Text style={styles.noDataDesc}>기록 없음</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function BottomButton({ title, iconPlaceholder, iconSource, onClick }) {
  return (
    <TouchableOpacity style={styles.bottomButton} onPress={onClick} activeOpacity={0.8}>
      <View style={styles.iconBox}>
        {iconSource ? (
           <Image source={iconSource} style={styles.iconImage} />
        ) : (
           <Text style={styles.iconText}>{iconPlaceholder}</Text>
        )}
      </View>
      <Text style={styles.menuTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFF' },
  scrollContent: { padding: 24, paddingTop: 10 },
  center: { justifyContent: 'center', alignItems: 'center' },
  headerSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, marginTop: 20 },
  dateText: { fontSize: 15, color: '#515151', marginBottom: 16, fontWeight: '300' },
  greetingText: { fontSize: 15, color: '#6D6D6D', marginBottom: 2, fontWeight: '300' },
  stepsWrapper: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  stepsPrefix: { fontSize: 20, marginRight: 5, color: '#3584FE', fontWeight: '600' },
  stepsCount: { fontSize: 20, fontWeight: '700', color: '#3584FE' },
  goalText: { fontSize: 12, color: '#6D6D6D', fontWeight: '300' },
  penguinImageContainer: { width: 103, height: 100, justifyContent: 'center', alignItems: 'center', borderRadius: 50, overflow: 'hidden' },
  penguinImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  menuCard: { backgroundColor: 'white', borderRadius: 28, paddingVertical: 10, marginBottom: 20, borderWidth: 0.3, borderColor: '#D9D9D9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  iconBox: { width: 45, height: 45, backgroundColor: '#F7FAFF', borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  iconText: { fontSize: 20 },
  iconImage: { width: '60%', height: '60%', resizeMode: 'contain' },
  landmarkTransform: { transform: [{ scale: 1.4 }] },
  textBox: { flex: 1, flexDirection: 'column' },
  menuTitle: { fontSize: 15, fontWeight: '600', color: '#515151', lineHeight: 20 },
  menuDesc: { fontSize: 12, color: '#000000', marginTop: 2, fontWeight: '300' },
  noDataDesc: { color: '#ccc', fontSize: 11, marginTop: 2 },
  bottomButton: { backgroundColor: 'white', borderRadius: 25, paddingHorizontal: 24, height: 60, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 0.3, borderColor: '#D9D9D9' },
  logoutButton: { backgroundColor: '#ffebee', marginTop: 10, borderColor: '#ffcdd2' },
  logoutIconBox: { backgroundColor: '#ffffff' }
});