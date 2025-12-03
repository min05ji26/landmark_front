import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  FlatList, SafeAreaView, Platform, Image, Keyboard, ActivityIndicator, Modal, Dimensions 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { getItem } from '../utils/authStorage'; 
import { API_URL } from '../constants/constants';

const ITEMS_PER_PAGE = 3; 
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

export default function LandmarkScreen() {
  const navigation = useNavigation();
  
  const [allLandmarks, setAllLandmarks] = useState([]); 
  const [displayedLandmarks, setDisplayedLandmarks] = useState([]); 
  const [searchText, setSearchText] = useState(""); 
  
  const [userSteps, setUserSteps] = useState(0); 
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // 🔒 잠금 팝업 관련 상태
  const [lockedModalVisible, setLockedModalVisible] = useState(false);
  const [selectedLockedItem, setSelectedLockedItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

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

      const landmarkRes = await fetch(`${API_URL}/api/landmarks`, { headers });
      const landmarkJson = await landmarkRes.json();
      
      const userRes = await fetch(`${API_URL}/api/user/info`, { headers });
      const userJson = await userRes.json();

      if (landmarkJson.success) {
        setAllLandmarks(landmarkJson.data);
        setTotalPages(Math.ceil(landmarkJson.data.length / ITEMS_PER_PAGE));
      }

      if (userJson.success) {
        setUserSteps(userJson.data.totalSteps);
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

  // 랜드마크 아이템 클릭 핸들러
  const handlePressItem = (item) => {
    const isUnlocked = userSteps >= item.requiredSteps;
    
    if (isUnlocked) {
      // 해금됨 -> 상세 페이지 이동
      navigation.navigate('LandmarkDetail', { landmark: item });
    } else {
      // 미해금 -> 커스텀 팝업 띄우기
      setSelectedLockedItem(item);
      setLockedModalVisible(true);
    }
  };

  const renderItem = ({ item }) => {
    const isUnlocked = userSteps >= item.requiredSteps;
    const imageSource = landmarkImages[item.imageUrl] || landmarkImages["default"];

    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => handlePressItem(item)}
      >
        <View style={styles.imageBox}>
          <Image 
            source={imageSource} 
            style={styles.realImage} 
            resizeMode="cover"
          />
        </View>

        <View style={styles.textArea}>
          <Text style={[styles.title, !isUnlocked && styles.lockedText]}>
            {item.name}
          </Text>
          
          <Text style={[styles.desc, !isUnlocked && styles.lockedTextSmall]} numberOfLines={1}>
            {item.description || "설명이 없습니다."}
          </Text>
          
          <Text style={[styles.steps, !isUnlocked && styles.lockedTextSmall]}>
            필요 걸음: {item.requiredSteps.toLocaleString()}보
          </Text>
        </View>

        {!isUnlocked && (
           <View style={{position: 'absolute', right: 20}}>
             <Text style={{fontSize: 20}}>🔒</Text>
           </View>
        )}
      </TouchableOpacity>
    );
  };

  // 🔒 미해금 랜드마크 정보 모달
  const renderLockedModal = () => {
    if (!selectedLockedItem) return null;

    const imageSource = landmarkImages[selectedLockedItem.imageUrl] || landmarkImages["default"];
    const required = selectedLockedItem.requiredSteps || 0;
    const current = userSteps;
    const remaining = Math.max(0, required - current);
    
    // ✅ 퍼센트 계산 (0으로 나누기 방지)
    let percent = 0;
    if (required === 0) {
        percent = 100; // 필요 걸음이 0이면 이미 100%
    } else {
        percent = Math.min(100, Math.floor((current / required) * 100));
    }

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={lockedModalVisible}
        onRequestClose={() => setLockedModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* 상단 닫기 버튼 */}
            <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setLockedModalVisible(false)}
            >
                <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {/* 1. 랜드마크 이름 */}
            <Text style={styles.modalTitle}>{selectedLockedItem.name}</Text>

            {/* 2. 이미지 */}
            <View style={styles.modalImageBox}>
                <Image source={imageSource} style={styles.modalImage} resizeMode="cover" />
            </View>

            {/* 3. 현재 걸음 수 (파란색 큰 글씨) */}
            <View style={styles.stepsRow}>
                <Text style={styles.modalCurrentSteps}>{current.toLocaleString()}</Text>
                <Text style={styles.modalStepsLabel}> 걸음</Text>
            </View>

            {/* 4. 남은 걸음 수 메시지 */}
            <Text style={styles.modalMessage}>
                {selectedLockedItem.name} 달성까지는 {remaining.toLocaleString()}보 남았어요
            </Text>

            {/* 5. 프로그레스 바 */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
                </View>
                <Text style={styles.progressText}>{percent}%</Text>
            </View>

          </View>
        </View>
      </Modal>
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
            <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
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

      {/* 모달 렌더링 */}
      {renderLockedModal()}

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
  
  card: {
    backgroundColor: '#fff', borderRadius: 20,
    flexDirection: 'row', alignItems: 'center',
    padding: 15, marginBottom: 15,
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 5, elevation: 2
  },
  imageBox: {
    width: 80, height: 80,
    backgroundColor: '#F0F0F0',
    borderRadius: 15,
    marginRight: 15,
    overflow: 'hidden'
  },
  realImage: { width: '100%', height: '100%' },
  textArea: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  desc: { fontSize: 13, color: '#888', marginBottom: 4 },
  steps: { fontSize: 12, color: '#4A90E2', fontWeight: '600' },

  lockedText: { color: '#ccc' }, 
  lockedTextSmall: { color: '#e0e0e0' },
  
  pagination: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 20
  },
  pageNumberBox: { padding: 10 },
  pageNumber: { fontSize: 16, color: '#ccc' },
  activePageNumber: { color: '#333', fontWeight: 'bold', textDecorationLine: 'underline' },
  pageArrow: { fontSize: 16, color: '#ccc', marginHorizontal: 10 },

  // 🔒 모달 스타일
  modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center', alignItems: 'center'
  },
  modalContent: {
      width: width * 0.85, backgroundColor: '#fff', borderRadius: 25,
      padding: 25, alignItems: 'center', elevation: 10
  },
  closeButton: {
      alignSelf: 'flex-end', padding: 5
  },
  closeButtonText: { fontSize: 18, color: '#aaa' },
  
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  
  modalImageBox: {
      width: '100%', height: 180, borderRadius: 15, overflow: 'hidden', marginBottom: 20,
      backgroundColor: '#f0f0f0'
  },
  modalImage: { width: '100%', height: '100%' },
  
  stepsRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 5 },
  modalCurrentSteps: { fontSize: 32, fontWeight: 'bold', color: '#4A90E2' },
  modalStepsLabel: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  
  modalMessage: { fontSize: 14, color: '#888', marginBottom: 30 },
  
  progressContainer: { width: '100%', flexDirection: 'row', alignItems: 'center' },
  progressBarBg: { 
      flex: 1, height: 12, backgroundColor: '#E0E0E0', 
      borderRadius: 6, overflow: 'hidden', marginRight: 10 
  },
  progressBarFill: { height: '100%', backgroundColor: '#4A90E2' },
  progressText: { fontSize: 12, color: '#555', width: 40, textAlign:'right' }
});