<template>
  <div class="search-container">
    <div class="search-group">
      <label>省份搜索：</label>
      <input v-model="provinceKeyword" placeholder="输入省份名称" />
    </div>
    
    <div class="search-group">
      <label>产品搜索：</label>
      <input v-model="productKeyword" placeholder="输入产品规格（如80L/单门）" />
    </div>

    <div v-if="hasResults" class="result-table">
      <table>
        <thead>
          <tr>
            <th>省份</th>
            <th v-for="product in matchedProducts" :key="product">{{ product }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="province in matchedProvinces" :key="province">
            <td>{{ province }}</td>
            <td v-for="product in matchedProducts" :key="product">
              {{ getPrice(province, product) || '-' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="no-data">
      {{ getEmptyText() }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import * as XLSX from 'xlsx';

const excelFiles = ['data1.xls', ];
const allData = ref({});
const provinceKeyword = ref('');
const productKeyword = ref('');

// 数据处理逻辑
const processSheet = (worksheet) => {
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  return {
    products: rows[0]?.slice(1) || [],
    data: rows.slice(1).reduce((acc, row) => {
      const province = row[0];
      if (province) {
        acc[province] = row.slice(1).reduce((p, val, idx) => {
          p[rows[0][idx + 1]] = val;
          return p;
        }, {});
      }
      return acc;
    }, {})
  };
};

// 加载数据
const loadData = async () => {
  const mergedData = {};

  for (const file of excelFiles) {
    try {
      const res = await fetch(`/public/${file}`);
      const arrayBuffer = await res.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const { products, data } = processSheet(workbook.Sheets[workbook.SheetNames[0]]);
      
      Object.entries(data).forEach(([province, prices]) => {
        mergedData[province] = mergedData[province] || {};
        products.forEach(product => {
          mergedData[province][product] = prices[product] || mergedData[province][product];
        });
      });
    } catch (error) {
      console.error('文件读取失败:', error);
    }
  }

  allData.value = mergedData;
};

// 计算属性
const matchedProvinces = computed(() => {
  const keyword = provinceKeyword.value.trim().toLowerCase();
  if (!keyword) return [];
  return Object.keys(allData.value).filter(p => 
    p.toLowerCase().includes(keyword)
  );
});

const matchedProducts = computed(() => {
  const keyword = productKeyword.value.trim().toLowerCase();
  if (!keyword) return [];
  
  const allProducts = [...new Set(
    Object.values(allData.value).flatMap(p => Object.keys(p))
  )];
  
  return allProducts.filter(p => 
    p.toLowerCase().includes(keyword)
  );
});

const hasResults = computed(() => 
  matchedProvinces.value.length > 0 || matchedProducts.value.length > 0
);

// 辅助方法
const getPrice = (province, product) => {
  return allData.value[province]?.[product];
};

const getEmptyText = () => {
  if (provinceKeyword.value || productKeyword.value) {
    return '没有找到匹配的数据';
  }
  return '请输入搜索条件查看结果';
};

onMounted(loadData);
</script>

<style scoped>
.search-container {
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
}

.search-group {
  margin-bottom: 15px;
}

.search-group label {
  display: inline-block;
  width: 100px;
  font-weight: bold;
}

input {
  width: 300px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.result-table {
  margin-top: 20px;
  overflow-x: auto;
}

table {
  border-collapse: collapse;
  width: 100%;
}

th, td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: center;
  min-width: 120px;
}

th {
  background-color: #f5f5f5;
  position: sticky;
  top: 0;
}

.no-data {
  margin-top: 20px;
  color: #666;
  text-align: center;
  padding: 20px;
}
</style>