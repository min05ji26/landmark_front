import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, Image, TouchableOpacity, 
  SafeAreaView, Platform, Dimensions, ActivityIndicator 
} from 'react-native';
import { getItem } from '../utils/authStorage'; 
import { API_URL } from '../constants/constants';

const { width } = Dimensions.get('window');

// ✅ 랜드마크 이미지 매핑
const landmarkImages = {
  // 여기도 경로(../..)를 수정하고, 'Osaca' 오타를 'Osaka'로 고쳐야 합니다.
  "Busan": require('../../assets/images/Busan.png'),
  "Osaka": require('../../assets/images/Osaka.png'), 
  "Paris": require('../../assets/images/Paris.png'),
  "USA": require('../../assets/images/USA.png'),
  "China": require('../../assets/images/China.png'),
  "India": require('../../assets/images/India.png'),
  "Egypt": require('../../assets/images/Egypt.png'),
  "Australia": require('../../assets/images/Australia.png')
};

// ✅ 랜드마크 설명 매핑
const landmarkDescriptions = {
  "해운대": "한국 부산을 대표하는 가장 유명한 해변으로, 사계절 내내 여행객이 찾는 휴양 명소예요.",
  "오사카성": "일본 오사카의 상징적인 성으로, 벚꽃 시즌에 가장 아름다운 풍경을 보여줘요.",
  "에펠탑": "파리를 상징하는 철탑으로, 세계에서 가장 로맨틱한 야경 명소로 손꼽혀요.",
  "자유의 여신상": "미국의 자유와 희망을 상징하는 조형물로, 뉴욕을 대표하는 랜드마크예요.",
  "만리장성": "중국의 역사와 규모를 느낄 수 있는 세계 최장의 방어 건축물이에요.",
  "타지마할": "인도 아그라에 위치한 순백의 대리석 무덤으로, 사랑을 상징하는 건축물로 유명해요.",
  "피라미드": "고대 이집트 파라오들의 무덤으로, 인류의 신비와 기술을 보여주는 대표 유적이에요.",
  "시드니 오페라하우스": "독특한 조개껍질 모양의 지붕으로 유명한 호주의 대표 공연 예술 건축물이에요"
};

export default function LandmarkDetailScreen({ route, navigation }) {
  const { landmark } = route.params; 

  const [userTotalSteps, setUserTotalSteps] = useState(0);
  const [nextLandmark, setNextLandmark] = useState(null); // 다음 목표 랜드마크
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = await getItem('userToken');
      if (!token) return;
      
      const headers = { Authorization: `Bearer ${token}` };

      // 1. 내 정보 조회 (걸음 수)
      const userRes = await fetch(`${API_URL}/api/user/info`, { headers });
      const userJson = await userRes.json();
      
      // 2. 전체 랜드마크 조회 (다음 단계 찾기용)
      const lmRes = await fetch(`${API_URL}/api/landmarks`, { headers });
      const lmJson = await lmRes.json();

      if (userJson.success && lmJson.success) {
        setUserTotalSteps(userJson.data.totalSteps);
        
        // 다음 랜드마크 찾기 로직
        const allLandmarks = lmJson.data; 
        const next = allLandmarks.find(lm => lm.requiredSteps > landmark.requiredSteps);
        setNextLandmark(next || null); 
      }
    } catch (error) {
      console.error("데이터 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 계산 로직 ---
  const isCurrentUnlocked = userTotalSteps >= landmark.requiredSteps;

  let targetName = landmark.name;
  let targetSteps = landmark.requiredSteps;
  let currentProgress = 0;
  let remainSteps = 0;
  let message = "";

  if (isCurrentUnlocked && nextLandmark) {
    targetName = nextLandmark.name;
    targetSteps = nextLandmark.requiredSteps;
    
    currentProgress = Math.min(100, Math.floor((userTotalSteps / targetSteps) * 100));
    remainSteps = Math.max(0, targetSteps - userTotalSteps);
    message = `${targetName} 해금까지 ${remainSteps.toLocaleString()}보 남았어요!!`;
  
  } else if (isCurrentUnlocked && !nextLandmark) {
    currentProgress = 100;
    message = "모든 랜드마크를 정복하셨습니다! 대단해요! 🎉";

  } else {
    targetName = landmark.name;
    targetSteps = landmark.requiredSteps;
    
    if (targetSteps === 0) {
        currentProgress = 100; 
    } else {
        currentProgress = Math.min(100, Math.floor((userTotalSteps / targetSteps) * 100));
    }
    remainSteps = Math.max(0, targetSteps - userTotalSteps);
    
    if (remainSteps > 0) {
        message = `${targetName} 해금까지 ${remainSteps.toLocaleString()}보 남았어요!!`;
    } else {
        message = `축하합니다! ${targetName}을(를) 달성했어요! 🎉`;
    }
  }

  // 이미지 & 설명 매핑
  const imageSource = landmarkImages[landmark.imageUrl] || landmarkImages["default"];
  const descriptionText = landmarkDescriptions[landmark.name] || landmark.description || "설명이 없습니다.";

  if (loading) {
    return (
        <View style={[styles.container, {justifyContent:'center', alignItems:'center'}]}>
            <ActivityIndicator size="large" color="#4A90E2" />
        </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 10}}>
          <Text style={{fontSize: 24, color: '#A0C4FF'}}>{"<"}</Text>
        </TouchableOpacity>
        <View style={{width: 30}} /> 
      </View>

      <View style={styles.content}>
        <Text style={styles.landmarkName}>{landmark.name}</Text>

        <View style={styles.imageBox}>
           <Image source={imageSource} style={styles.image} resizeMode="cover" />
        </View>

        <View style={styles.divider} />

        <View style={styles.infoContainer}>
          <View style={styles.stepRow}>
            <Text style={styles.currentSteps}>{userTotalSteps.toLocaleString()}</Text>
            <Text style={styles.stepLabel}> 걸음</Text>
          </View>
          
          {/* 🚨 [이동됨] 남은 걸음 수 메시지는 아래 프로그레스 바 섹션으로 이동 */}

          <Text style={styles.descriptionText}>
            {descriptionText}
          </Text>
        </View>

        {/* ✅ 프로그레스 바 & 달리는 사람 아이콘 */}
        <View style={styles.progressWrapper}>
            {/* ✅ [이동] 남은 걸음 수 메시지 */}
            <Text style={styles.remainTextAbove}>{message}</Text>

            {/* 바 영역 컨테이너 (아이콘과 바를 묶음) */}
            <View style={styles.barContainer}>
                {/* 달리는 사람 아이콘 */}
                <View style={[styles.runnerContainer, { left: `${currentProgress}%` }]}>
                    {/* ✅ [수정] 아이콘 좌우 반전 (transform scaleX: -1) */}
                    <Text style={{fontSize: 24, transform: [{ scaleX: -1 }]}}>🏃</Text>
                </View>

                <View style={styles.progressBarBackground}>
                    <View style={[styles.progressBarFill, { width: `${currentProgress}%` }]} />
                    {/* ✅ [수정] 퍼센트 텍스트 중앙 배치 */}
                    <View style={styles.percentTextContainer}>
                        <Text style={styles.progressTextCenter}>{currentProgress}%</Text>
                    </View>
                </View>
            </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFF' },
  
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, paddingTop: 10, marginBottom: 10 
  },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 30 },

  landmarkName: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 20, marginTop: 10 },

  imageBox: {
    width: '100%', height: 220,
    backgroundColor: '#D9D9D9', borderRadius: 25, marginBottom: 25,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 5
  },
  image: { width: '100%', height: '100%' },

  divider: { width: '100%', height: 1, backgroundColor: '#F0F0F0', marginBottom: 25 },

  infoContainer: { alignItems: 'center', marginBottom: 10, width: '100%' },
  stepRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 15 },
  currentSteps: { fontSize: 36, fontWeight: 'bold', color: '#4A90E2' },
  stepLabel: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  
  descriptionText: {
    fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 20,
    paddingHorizontal: 15, paddingVertical: 12,
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#EAF3FF',
    width: '100%'
  },

  // ✅ 프로그레스 바 영역 스타일
  progressWrapper: { 
      width: '100%', marginTop: 'auto', marginBottom: 40, 
  },
  
  // 상단 메시지 스타일
  remainTextAbove: { 
      fontSize: 14, color: '#555', marginBottom: 5, 
      fontWeight: '600', textAlign: 'center' 
  },

  barContainer: {
      position: 'relative',
      paddingTop: 25 // 아이콘 공간 확보
  },
  
  runnerContainer: {
      position: 'absolute',
      top: 0, 
      marginLeft: -12, // 아이콘 중심 보정
      zIndex: 10
  },

  progressBarBackground: {
    height: 18, backgroundColor: '#E0E0E0',
    borderRadius: 9, overflow: 'hidden',
    width: '100%',
    position: 'relative' // 내부 절대 위치 자식(텍스트)을 위해
  },
  progressBarFill: {
    height: '100%', backgroundColor: '#4A90E2', borderRadius: 9
  },
  
  // 퍼센트 텍스트 중앙 정렬용 컨테이너
  percentTextContainer: {
      position: 'absolute',
      top: 0, bottom: 0, left: 0, right: 0,
      justifyContent: 'center', alignItems: 'center',
      zIndex: 5
  },
  progressTextCenter: {
      color: 'white', fontSize: 11, fontWeight: 'bold',
      textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 2
  }
});