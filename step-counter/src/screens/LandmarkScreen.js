import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  FlatList, SafeAreaView, Platform, Image, Keyboard, Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// 🚨 경로 확인 (상위 폴더 utils)
import { getItem } from '../utils/authStorage'; 
import { API_URL } from '../constants/constants';

// API URL (웹/앱 분기)


const ITEMS_PER_PAGE = 3; 

export default function LandmarkScreen() {
  const navigation = useNavigation();
  
  const [allLandmarks, setAllLandmarks] = useState([]); 
  const [displayedLandmarks, setDisplayedLandmarks] = useState([]); 
  const [searchText, setSearchText] = useState(""); 
  
  const [userSteps, setUserSteps] = useState(0); // 👤 내 걸음 수 상태 추가
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // 1. 초기 데이터 로드 (랜드마크 목록 + 내 정보)
  useEffect(() => {
    fetchData();
  }, []);

  // 2. 검색어 및 페이지 변경 시 리스트 갱신
  useEffect(() => {
    const filtered = allLandmarks.filter((item) => 
        item.name.toLowerCase().includes(searchText.toLowerCase())
    );

    const newTotalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    setTotalPages(newTotalPages > 0 ? newTotalPages : 1);

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    setDisplayedLandmarks(filtered.slice(start, end));

  }, [searchText, currentPage, allLandmarks]);

  const fetchData = async () => {
    try {
      const token = await getItem('userToken');
      if (!token) return;

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // (1) 랜드마크 목록 조회
      const landmarkRes = await fetch(`${API_URL}/api/landmarks`, { headers });
      const landmarkJson = await landmarkRes.json();
      
      // (2) 내 유저 정보 조회 (걸음 수 확인용)
      const userRes = await fetch(`${API_URL}/api/user/info`, { headers });
      const userJson = await userRes.json();

      if (landmarkJson.success) {
        setAllLandmarks(landmarkJson.data);
        setTotalPages(Math.ceil(landmarkJson.data.length / ITEMS_PER_PAGE));
      }

      if (userJson.success) {
        setUserSteps(userJson.data.totalSteps); // 내 걸음 수 저장
      }

    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchText(text);
    setCurrentPage(1); 
  };

  const handleSearchSubmit = () => {
    Keyboard.dismiss();
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 🎨 렌더링 아이템 (잠금 로직 적용)
  const renderItem = ({ item }) => {
    // 해금 여부 판단 (내 걸음 수 >= 필요 걸음 수)
    const isUnlocked = userSteps >= item.requiredSteps;

    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => {
          if (isUnlocked) {
            // 해금되었으면 상세 페이지 이동
            navigation.navigate('LandmarkDetail', { landmark: item });
          } else {
            // 미해금 시 알림창 띄우기
            if (Platform.OS === 'web') {
               alert(`아직 해금되지 않은 랜드마크 입니다.\n필요 걸음 수 : ${item.requiredSteps.toLocaleString()}보`);
            } else {
               Alert.alert(
                 "🔒 잠겨있음", 
                 `아직 해금되지 않은 랜드마크 입니다.\n필요 걸음 수 : ${item.requiredSteps.toLocaleString()}보`
               );
            }
          }
        }}
      >
        {/* 이미지 영역 */}
        <View style={[styles.imageBox, !isUnlocked && styles.lockedImageBox]}>
          {item.imageUrl ? (
              <Image 
                source={{uri: item.imageUrl}} 
                style={[styles.realImage, !isUnlocked && styles.lockedImage]} 
              />
          ) : null}
        </View>

        {/* 텍스트 영역 */}
        <View style={styles.textArea}>
          {/* 제목: 잠겨있으면 회색(#ccc) + 굵기 조정 */}
          <Text style={[styles.title, !isUnlocked && styles.lockedText]}>
            {item.name}
          </Text>
          
          <Text style={[styles.desc, !isUnlocked && styles.lockedTextSmall]}>
            {item.description || "설명이 없습니다."}
          </Text>
          
          {/* 걸음 수: 잠겨있으면 안보이게 할 수도 있고, 흐리게 할 수도 있음 (여기선 흐리게 유지) */}
          <Text style={[styles.steps, !isUnlocked && styles.lockedTextSmall]}>
            필요 걸음: {item.requiredSteps.toLocaleString()}보
          </Text>
        </View>

        {/* 잠금 아이콘 (선택 사항) */}
        {!isUnlocked && (
           <View style={{position: 'absolute', right: 20}}>
             <Text style={{fontSize: 20}}>🔒</Text>
           </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.topBar}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 10}}>
             <Text style={{fontSize: 24, color: '#A0C4FF'}}>{"<"}</Text>
           </TouchableOpacity>
           <Text style={styles.headerTitle}>랜드마크</Text>
           <View style={{width: 30}} /> 
        </View>

        <View style={styles.searchBar}>
          <TextInput 
            style={styles.searchInput} 
            placeholder="랜드마크를 입력하세요" 
            placeholderTextColor="#aaa"
            value={searchText}
            onChangeText={handleSearch} 
            onSubmitEditing={handleSearchSubmit} 
            returnKeyType="search"
          />
          <TouchableOpacity onPress={handleSearchSubmit}>
             <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listContainer}>
        {loading ? (
          <Text style={{textAlign:'center', marginTop: 20}}>로딩 중...</Text>
        ) : (
          <FlatList
            data={displayedLandmarks}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <Text style={{textAlign:'center', marginTop: 50, color:'#888'}}>
                검색 결과가 없습니다.
              </Text>
            }
          />
        )}
      </View>

      {!loading && displayedLandmarks.length > 0 && (
        <View style={styles.pagination}>
          <TouchableOpacity 
            onPress={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
             <Text style={[styles.pageArrow, currentPage === 1 && {opacity:0.3}]}>{"<"}</Text>
          </TouchableOpacity>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <TouchableOpacity 
              key={page} 
              onPress={() => handlePageChange(page)}
              style={styles.pageNumberBox}
            >
              <Text style={[
                styles.pageNumber, 
                currentPage === page && styles.activePageNumber
              ]}>
                {page}
              </Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity 
            onPress={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <Text style={[styles.pageArrow, currentPage === totalPages && {opacity:0.3}]}>{">"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFF' },
  headerContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 25,
    paddingHorizontal: 15, height: 50,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  searchInput: { flex: 1, fontSize: 15 },
  searchIcon: { fontSize: 20, paddingLeft: 10 },
  listContainer: { flex: 1, paddingHorizontal: 20, marginTop: 10 },
  
  // 기본 카드 디자인
  card: {
    backgroundColor: '#fff', borderRadius: 20,
    flexDirection: 'row', alignItems: 'center',
    padding: 15, marginBottom: 15,
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 5, elevation: 2
  },
  imageBox: {
    width: 80, height: 80,
    backgroundColor: '#D9D9D9',
    borderRadius: 15,
    marginRight: 15,
    overflow: 'hidden'
  },
  realImage: {
    width: '100%', height: '100%', resizeMode: 'cover'
  },
  textArea: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  desc: { fontSize: 13, color: '#888', marginBottom: 4 },
  steps: { fontSize: 12, color: '#4A90E2', fontWeight: '600' },

  // 🔒 잠금 상태 스타일 (회색 처리)
  lockedText: { color: '#ccc' }, 
  lockedTextSmall: { color: '#e0e0e0' },
  lockedImageBox: { opacity: 0.5 }, // 이미지 박스 전체 투명도
  lockedImage: { tintColor: 'gray' }, // (옵션) 이미지 흑백 처리 효과

  pagination: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 20
  },
  pageNumberBox: { padding: 10 },
  pageNumber: { fontSize: 16, color: '#ccc' },
  activePageNumber: { color: '#333', fontWeight: 'bold', textDecorationLine: 'underline' },
  pageArrow: { fontSize: 16, color: '#ccc', marginHorizontal: 10 }
});