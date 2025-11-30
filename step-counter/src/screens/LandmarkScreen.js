import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  FlatList, SafeAreaView, Platform, Image 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// 🚨 경로 확인 (상위 폴더 utils)
import { getItem } from '../utils/authStorage'; 

// API URL (웹/앱 분기)
const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:8080' 
  : 'http://192.168.219.140:8080';

const ITEMS_PER_PAGE = 3; 

export default function LandmarkScreen() {
  const navigation = useNavigation();
  
  const [allLandmarks, setAllLandmarks] = useState([]); 
  const [displayedLandmarks, setDisplayedLandmarks] = useState([]); 
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLandmarks();
  }, []);

  useEffect(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    setDisplayedLandmarks(allLandmarks.slice(start, end));
  }, [currentPage, allLandmarks]);

  const fetchLandmarks = async () => {
    try {
      const token = await getItem('userToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/landmarks`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const json = await response.json();
      if (json.success) {
        const data = json.data;
        setAllLandmarks(data);
        setTotalPages(Math.ceil(data.length / ITEMS_PER_PAGE));
      }
    } catch (error) {
      console.error("랜드마크 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderItem = ({ item }) => (
    // 🚨 [수정된 부분] View 대신 TouchableOpacity 사용 & onPress 추가
    // 클릭 시 'LandmarkDetail' 화면으로 이동하며, 선택한 랜드마크 정보(item)를 함께 전달
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('LandmarkDetail', { landmark: item })}
    >
      <View style={styles.imageBox}>
        {item.imageUrl ? (
            <Image source={{uri: item.imageUrl}} style={styles.realImage} />
        ) : null}
      </View>

      <View style={styles.textArea}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.desc}>{item.description || "설명이 없습니다."}</Text>
        <Text style={styles.steps}>필요 걸음: {item.requiredSteps.toLocaleString()}보</Text>
      </View>
    </TouchableOpacity>
  );

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
          />
          <Text style={styles.searchIcon}>🔍</Text>
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
          />
        )}
      </View>

      <View style={styles.pagination}>
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
        {totalPages > 1 && currentPage < totalPages && (
             <TouchableOpacity onPress={() => handlePageChange(currentPage + 1)}>
                <Text style={styles.pageArrow}>{">"}</Text>
             </TouchableOpacity>
        )}
      </View>
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
  searchIcon: { fontSize: 20 },
  listContainer: { flex: 1, paddingHorizontal: 20, marginTop: 10 },
  
  // 카드 디자인
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
  pagination: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 20
  },
  pageNumberBox: { padding: 10 },
  pageNumber: { fontSize: 16, color: '#ccc' },
  activePageNumber: { color: '#333', fontWeight: 'bold', textDecorationLine: 'underline' },
  pageArrow: { fontSize: 16, color: '#ccc', marginLeft: 10 }
});