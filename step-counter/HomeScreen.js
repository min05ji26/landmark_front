import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  RefreshControl, 
  Alert, 
  Platform 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; // 화면 돌아올 때 데이터 갱신용

// 🚨 [수정 1] SecureStore 직접 사용 대신 authStorage 유틸리티 사용
// (authStorage.js 파일이 같은 폴더에 있어야 합니다)
import { getItem, deleteItem } from './authStorage'; 

// 🚨 [수정 2] 웹과 앱의 API 주소 분리
const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:8080'           // 웹용
  : 'http://192.168.219.140:8080';    // ⚠️ 앱용: 본인 PC IP 확인 필요

export default function HomeScreen({ navigation, stepCount, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- 화면 상태 데이터 ---
  const [todayDate, setTodayDate] = useState("");
  const [nickname, setNickname] = useState("");
  const [serverTotalSteps, setServerTotalSteps] = useState(0); // 서버에 저장된 걸음
  const [representativeTitle, setRepresentativeTitle] = useState("");
  const [myRank, setMyRank] = useState(0);

  const [targetLandmark, setTargetLandmark] = useState("");
  const [goalSteps, setGoalSteps] = useState(0);
  const [currentLocation, setCurrentLocation] = useState("");

  // 앱 내 실시간 걸음 수 + 서버 걸음 수 합산
  const displayTotalSteps = serverTotalSteps + (stepCount || 0);
  
  // 남은 걸음 계산 (음수 방지)
  const remainingSteps = Math.max(0, goalSteps - displayTotalSteps);

  // 1. 날짜 설정 및 초기 데이터 로드
  useEffect(() => {
    const now = new Date();
    setTodayDate(`${now.getMonth() + 1}월 ${now.getDate()}일`);
    fetchHomeData();
  }, []);

  // 2. 화면이 포커스될 때마다 데이터 갱신 (네비게이션 이동 후 복귀 시)
  useFocusEffect(
    useCallback(() => {
      fetchHomeData();
    }, [])
  );

  // 3. 서버 데이터 가져오기
  const fetchHomeData = async () => {
    try {
      // 🚨 [수정 3] getItem 사용 (웹/앱 호환)
      const token = await getItem('userToken');
      
      if (!token) {
        Alert.alert("알림", "로그인이 필요합니다.");
        if(onLogout) onLogout(); 
        return;
      }

      console.log(`[Home] 데이터 요청: ${API_URL}/api/home`);

      const response = await fetch(`${API_URL}/api/home`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // ✅ JWT 토큰 헤더
        },
      });

      if (response.status === 401) {
        Alert.alert("인증 만료", "다시 로그인 해주세요.");
        // 토큰 만료 시 삭제도 호환성 있게 처리
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
      } else {
        console.log("데이터 불러오기 실패:", jsonData.message);
      }
    } catch (error) {
      console.error("통신 에러:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 4. 당겨서 새로고침
  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  // 5. 로그아웃 처리
  const handleLogoutPress = () => {
    Alert.alert(
      "로그아웃",
      "정말 로그아웃 하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        { 
          text: "확인", 
          style: 'destructive',
          onPress: async () => {
            // 🚨 [수정 4] deleteItem 사용 (웹/앱 호환)
            await deleteItem('userToken'); 
            if (onLogout) onLogout(); 
          }
        }
      ]
    );
  };

  // 로딩 화면
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
        
        {/* --- 상단 헤더 섹션 --- */}
        <View style={styles.headerSection}>
          <View style={{flex: 1}}>
            <Text style={styles.dateText}>{todayDate}</Text>
            <Text style={styles.greetingText}>오늘 {nickname}님의 걸음 수예요</Text>
            
            <View style={styles.stepsWrapper}>
              <Text style={styles.stepsPrefix}>총</Text>
              {/* toLocaleString()으로 1,000 단위 콤마 */}
              <Text style={styles.stepsCount}>{displayTotalSteps.toLocaleString()} 걸음</Text>
            </View>
            
            <Text style={styles.goalText}>
               {remainingSteps > 0 
                 ? `${targetLandmark} 달성까지 ${remainingSteps.toLocaleString()}보 남았어요`
                 : `축하합니다! ${targetLandmark}에 도착했어요! 🎉`}
            </Text>
          </View>
          
          {/* 펭귄 이미지 */}
          <View style={styles.penguinImageContainer}>
             <Image 
               source={{ uri: "https://cdn-icons-png.flaticon.com/512/3069/3069172.png" }} 
               style={styles.penguinImage}
             />
          </View>
        </View>

        {/* --- 메인 메뉴 카드 --- */}
        <View style={styles.menuCard}>
          {/* 랜드마크 */}
          <MenuItem 
            title="랜드마크" 
            desc={`현재 내 위치 → ${currentLocation}`} 
            iconPlaceholder="🏯"
            isLandmark={true}
            onClick={() => Alert.alert("알림", "아직 준비중입니다! 🚧")} 
          />
          
          {/* 랭킹 (누르면 랭킹 화면으로 이동) */}
          <MenuItem 
            title="랭킹" 
            desc={`${myRank}위`} 
            iconPlaceholder="🥈"
            onClick={() => navigation.navigate('Ranking')} 
          />
          
          {/* 업적 */}
          <MenuItem 
            title="업적" 
            desc="" 
            iconPlaceholder="🏆"
            onClick={() => Alert.alert("알림", "아직 준비중입니다! 🚧")} 
          />
        </View>

        {/* --- 하단 버튼들 --- */}
        <BottomButton 
          title="내 프로필" 
          iconPlaceholder="👤" 
          onClick={() => Alert.alert("알림", "준비중입니다.")}
        />
        
        <BottomButton 
          title="친구" 
          iconPlaceholder="👥" 
          onClick={() => Alert.alert("알림", "준비중입니다.")}
        />
        
        {/* 로그아웃 버튼 */}
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

// ---------------------------------------------------------
// [하위 컴포넌트] MenuItem
// ---------------------------------------------------------
function MenuItem({ title, desc, iconPlaceholder, iconSource, isLandmark, onClick }) {
  const shouldHideDesc = desc === "0위" || desc === "0" || !desc;

  return (
    <TouchableOpacity style={styles.menuItem} onPress={onClick} activeOpacity={0.7}>
      <View style={styles.iconBox}>
        {iconSource ? (
           <Image source={iconSource} style={[styles.iconImage, isLandmark && styles.landmarkTransform]} />
        ) : (
           <Text style={[styles.iconText, isLandmark && styles.landmarkTransform]}>
             {iconPlaceholder}
           </Text>
        )}
      </View>
      
      <View style={styles.textBox}>
        <Text style={styles.menuTitle}>{title}</Text>
        {!shouldHideDesc ? (
           <Text style={styles.menuDesc}>{desc}</Text>
        ) : (
           title !== "업적" && (
             <Text style={styles.noDataDesc}>기록 없음</Text>
           )
        )}
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------
// [하위 컴포넌트] BottomButton
// ---------------------------------------------------------
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

// ---------------------------------------------------------
// [스타일 정의]
// ---------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFF', // 피그마 배경색
  },
  scrollContent: {
    padding: 24, // 좌우 여백 반영
    paddingTop: 10,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // 헤더
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    marginTop: 20,
  },
  dateText: {
    fontSize: 15,
    color: '#515151',
    marginBottom: 16,
    fontWeight: '300',
  },
  greetingText: {
    fontSize: 15,
    color: '#6D6D6D',
    marginBottom: 2,
    fontWeight: '300',
  },
  stepsWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  stepsPrefix: {
    fontSize: 20,
    marginRight: 5,
    color: '#3584FE',
    fontWeight: '600',
  },
  stepsCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3584FE',
  },
  goalText: {
    fontSize: 12,
    color: '#6D6D6D',
    fontWeight: '300',
  },
  penguinImageContainer: {
    width: 103,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    overflow: 'hidden',
  },
  penguinImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // 카드 메뉴
  menuCard: {
    backgroundColor: 'white',
    borderRadius: 28,
    paddingVertical: 10,
    marginBottom: 20,
    borderWidth: 0.3,
    borderColor: '#D9D9D9',
    // 그림자
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3, 
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  iconBox: {
    width: 45,
    height: 45,
    backgroundColor: '#F7FAFF',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 20,
  },
  iconImage: {
    width: '60%',
    height: '60%',
    resizeMode: 'contain',
  },
  landmarkTransform: {
    transform: [{ scale: 1.4 }], // 랜드마크 아이콘 확대
  },
  textBox: {
    flex: 1,
    flexDirection: 'column',
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#515151',
    lineHeight: 20,
  },
  menuDesc: {
    fontSize: 12,
    color: '#000000',
    marginTop: 2,
    fontWeight: '300',
  },
  noDataDesc: {
    color: '#ccc',
    fontSize: 11,
    marginTop: 2,
  },

  // 하단 버튼
  bottomButton: {
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 24,
    height: 60,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.3,
    borderColor: '#D9D9D9',
  },
  logoutButton: {
    backgroundColor: '#ffebee', // 연한 빨강
    marginTop: 10,
    borderColor: '#ffcdd2',
  },
  logoutIconBox: {
    backgroundColor: '#ffffff',
  }
});