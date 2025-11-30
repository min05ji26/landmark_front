import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, Image, TouchableOpacity, 
  SafeAreaView, Platform, Dimensions 
} from 'react-native';
import { getItem } from '../utils/authStorage'; 

// API URL 설정
const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:8080' 
  : 'http://192.168.219.140:8080'; 

const { width } = Dimensions.get('window');

export default function LandmarkDetailScreen({ route, navigation }) {
  // 이전 화면에서 넘겨준 랜드마크 정보 받기
  const { landmark } = route.params; 

  const [userTotalSteps, setUserTotalSteps] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMySteps();
  }, []);

  // 내 걸음 수 최신 정보 가져오기
  const fetchMySteps = async () => {
    try {
      const token = await getItem('userToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/user/info`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const json = await response.json();
      if (json.success) {
        setUserTotalSteps(json.data.totalSteps);
      }
    } catch (error) {
      console.error("유저 정보 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 계산 로직 ---
  // 목표 걸음 수
  const required = landmark.requiredSteps;
  // 현재 걸음 수
  const current = userTotalSteps;
  // 남은 걸음 (음수 방지)
  const remaining = Math.max(0, required - current);
  // 진행률 (0 ~ 100%)
  const progressPercent = Math.min(100, Math.floor((current / required) * 100));

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 10}}>
          <Text style={{fontSize: 24, color: '#A0C4FF'}}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}></Text> 
        <View style={{width: 30}} /> 
      </View>

      <View style={styles.content}>
        {/* 2. 랜드마크 이름 */}
        <Text style={styles.landmarkName}>{landmark.name}</Text>

        {/* 3. 랜드마크 이미지 (회색 박스) */}
        <View style={styles.imageBox}>
           {landmark.imageUrl ? (
             <Image source={{uri: landmark.imageUrl}} style={styles.image} />
           ) : null}
        </View>

        <View style={styles.divider} />

        {/* 4. 걸음 수 정보 */}
        <View style={styles.infoContainer}>
          <View style={styles.stepRow}>
            <Text style={styles.currentSteps}>{current.toLocaleString()}</Text>
            <Text style={styles.stepLabel}> 걸음</Text>
          </View>
          
          <Text style={styles.remainText}>
            {remaining > 0 
              ? `${landmark.name} 달성까지는 ${remaining.toLocaleString()}보 남았어요`
              : `축하합니다! ${landmark.name}을(를) 달성했어요! 🎉`}
          </Text>
        </View>

        {/* 5. 하단 프로그레스 바 */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]}>
                {/* 진행률 텍스트 (바 안에 표시) */}
                <Text style={styles.progressText}>{progressPercent}%</Text>
            </View>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFF' },
  
  // 헤더
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, paddingTop: 10, marginBottom: 10 
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },

  // 메인 컨텐츠 영역
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 30 },

  // 타이틀
  landmarkName: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 30, marginTop: 10 },

  // 이미지 박스
  imageBox: {
    width: '100%',
    height: 250,
    backgroundColor: '#D9D9D9', // 회색 배경
    borderRadius: 25,
    marginBottom: 30,
    overflow: 'hidden',
    // 그림자
    shadowColor: '#000', shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 5
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },

  // 구분선
  divider: { width: '100%', height: 1, backgroundColor: '#F0F0F0', marginBottom: 30 },

  // 텍스트 정보
  infoContainer: { alignItems: 'center', marginBottom: 40 },
  stepRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 },
  currentSteps: { fontSize: 40, fontWeight: 'bold', color: '#4A90E2' },
  stepLabel: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  remainText: { fontSize: 14, color: '#888' },

  // 프로그레스 바
  progressContainer: { width: '100%', position: 'absolute', bottom: 50 },
  progressBarBackground: {
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4A90E2', // 파란색 채우기
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center' // 텍스트 가운데 정렬
  },
  progressText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    position: 'absolute', // 글자가 바 밖으로 안 나가게
    right: 10
  }
});