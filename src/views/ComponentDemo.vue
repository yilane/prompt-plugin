<template>
  <div class="component-demo p-6 md:p-10 bg-white dark:bg-dark-card rounded-lg shadow-sm space-y-12">
    <div class="text-center">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">基础UI组件演示</h1>
      <p class="text-gray-600">AI提示词管理插件的基础组件库</p>
    </div>

    <!-- Button 组件演示 -->
    <section class="space-y-6">
      <h2 class="text-2xl font-semibold text-gray-800 dark:text-dark-text-primary border-b dark:border-dark-border pb-2">Button 按钮</h2>
      
      <div class="space-y-4">
        <div>
          <h3 class="text-lg font-medium mb-3">按钮变体</h3>
          <div class="flex flex-wrap gap-3">
            <Button variant="primary">主要按钮</Button>
            <Button variant="secondary">次要按钮</Button>
            <Button variant="success">成功按钮</Button>
            <Button variant="danger">危险按钮</Button>
            <Button variant="ghost">幽灵按钮</Button>
            <Button variant="link">链接按钮</Button>
          </div>
        </div>
        
        <div>
          <h3 class="text-lg font-medium mb-3">按钮尺寸</h3>
          <div class="flex flex-wrap items-center gap-3">
            <Button size="xs">超小按钮</Button>
            <Button size="sm">小按钮</Button>
            <Button size="md">中等按钮</Button>
            <Button size="lg">大按钮</Button>
            <Button size="xl">超大按钮</Button>
          </div>
        </div>
        
        <div>
          <h3 class="text-lg font-medium mb-3">按钮状态</h3>
          <div class="flex flex-wrap gap-3">
            <Button>正常状态</Button>
            <Button disabled>禁用状态</Button>
            <Button :loading="buttonLoading" @click="toggleButtonLoading">
              {{ buttonLoading ? '加载中...' : '点击加载' }}
            </Button>
            <Button block>块级按钮</Button>
          </div>
        </div>
      </div>
    </section>

    <!-- Input 组件演示 -->
    <section class="space-y-6">
      <h2 class="text-2xl font-semibold text-gray-800 dark:text-dark-text-primary border-b dark:border-dark-border pb-2">Input 输入框</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <Input
            v-model="inputValue"
            label="基础输入框"
            placeholder="请输入内容"
            help-text="这是帮助文本"
          />
          
          <Input
            v-model="inputWithIcon"
            label="带图标输入框"
            placeholder="搜索..."
            clearable
          >
            <template #prefix>
              <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </template>
          </Input>
          
          <Input
            v-model="inputWithError"
            label="错误状态"
            placeholder="输入内容"
            error="这是错误信息"
          />
        </div>
        
        <div class="space-y-4">
          <Input
            v-model="passwordValue"
            type="password"
            label="密码输入框"
            placeholder="请输入密码"
          />
          
          <Input
            v-model="numberValue"
            type="number"
            label="数字输入框"
            placeholder="请输入数字"
            :min="0"
            :max="100"
          />
          
          <Input
            v-model="textWithCount"
            label="字数统计"
            placeholder="最多100个字符"
            :maxlength="100"
            show-count
          />
        </div>
      </div>
    </section>

    <!-- Dropdown 组件演示 -->
    <section class="space-y-6">
      <h2 class="text-2xl font-semibold text-gray-800 dark:text-dark-text-primary border-b dark:border-dark-border pb-2">Dropdown 下拉菜单</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Dropdown
          v-model="selectedValue"
          :options="dropdownOptions"
          placeholder="请选择选项"
          @change="handleDropdownChange"
        />
        
        <Dropdown
          v-model="selectedValue2"
          :options="dropdownOptions"
          placeholder="自定义触发器"
        >
          <template #trigger="{ toggle }">
            <Button @click="toggle">
              {{ selectedValue2 ? getSelectedLabel(selectedValue2) : '自定义按钮' }}
            </Button>
          </template>
        </Dropdown>
        
        <Dropdown
          v-model="multipleValue"
          :options="dropdownOptions"
          placeholder="多选下拉"
          multiple
        />
      </div>
      
      <div class="text-sm text-gray-600 dark:text-dark-text-secondary">
        <p>选择的值: {{ selectedValue || '无' }}</p>
        <p>多选值: {{ multipleValue?.length ? multipleValue.join(', ') : '无' }}</p>
      </div>
    </section>

    <!-- Tag 组件演示 -->
    <section class="space-y-6">
      <h2 class="text-2xl font-semibold text-gray-800 dark:text-dark-text-primary border-b dark:border-dark-border pb-2">Tag 标签</h2>
      
      <div class="space-y-4">
        <div>
          <h3 class="text-lg font-medium mb-3">标签颜色</h3>
          <div class="flex flex-wrap gap-2">
            <Tag color="default">默认标签</Tag>
            <Tag color="primary">主要标签</Tag>
            <Tag color="success">成功标签</Tag>
            <Tag color="warning">警告标签</Tag>
            <Tag color="danger">危险标签</Tag>
            <Tag color="info">信息标签</Tag>
          </div>
        </div>
        
        <div>
          <h3 class="text-lg font-medium mb-3">标签变体</h3>
          <div class="flex flex-wrap gap-2">
            <Tag variant="filled" color="primary">实心标签</Tag>
            <Tag variant="outlined" color="primary">边框标签</Tag>
            <Tag variant="light" color="primary">浅色标签</Tag>
          </div>
        </div>
        
        <div>
          <h3 class="text-lg font-medium mb-3">可关闭标签</h3>
          <div class="flex flex-wrap gap-2">
            <Tag
              v-for="tag in tags"
              :key="tag.id"
              :color="tag.color"
              closable
              @close="removeTag(tag.id)"
            >
              {{ tag.name }}
            </Tag>
          </div>
        </div>
      </div>
    </section>

    <!-- Loading 组件演示 -->
    <section class="space-y-6">
      <h2 class="text-2xl font-semibold text-gray-800 dark:text-dark-text-primary border-b dark:border-dark-border pb-2">Loading 加载</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <h3 class="text-lg font-medium mb-3">加载类型</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 border rounded-lg">
              <h4 class="text-sm font-medium mb-2">旋转器</h4>
              <Loading type="spinner" text="加载中..." />
            </div>
            <div class="p-4 border rounded-lg">
              <h4 class="text-sm font-medium mb-2">点状</h4>
              <Loading type="dots" text="加载中..." />
            </div>
            <div class="p-4 border rounded-lg">
              <h4 class="text-sm font-medium mb-2">条状</h4>
              <Loading type="bars" text="加载中..." />
            </div>
            <div class="p-4 border rounded-lg">
              <h4 class="text-sm font-medium mb-2">脉冲</h4>
              <Loading type="pulse" text="加载中..." />
            </div>
          </div>
        </div>
        
        <div class="space-y-4">
          <h3 class="text-lg font-medium mb-3">遮罩加载</h3>
          <div class="relative border rounded-lg h-32">
            <div class="p-4">
              <p class="text-gray-600">这是被覆盖的内容</p>
              <p class="text-gray-600">后面有遮罩层</p>
            </div>
            <Loading overlay text="正在加载..." />
          </div>
        </div>
      </div>
    </section>

    <!-- Modal 组件演示 -->
    <section class="space-y-6">
      <h2 class="text-2xl font-semibold text-gray-800 dark:text-dark-text-primary border-b dark:border-dark-border pb-2">Modal 弹窗</h2>
      
      <div class="flex flex-wrap gap-4">
        <Button @click="showModal = true">基础弹窗</Button>
        <Button @click="showLargeModal = true">大型弹窗</Button>
        <Button @click="showCustomModal = true">自定义弹窗</Button>
      </div>

      <!-- 基础弹窗 -->
      <Modal
        v-model:visible="showModal"
        title="基础弹窗"
        @confirm="handleModalConfirm"
        @cancel="showModal = false"
      >
        <p>这是一个基础的弹窗示例，包含标题、内容和操作按钮。</p>
        <p class="mt-2">您可以点击确定或取消按钮来关闭弹窗。</p>
      </Modal>

      <!-- 大型弹窗 -->
      <Modal
        v-model:visible="showLargeModal"
        title="大型弹窗"
        size="lg"
        @confirm="showLargeModal = false"
        @cancel="showLargeModal = false"
      >
        <div class="space-y-4">
          <p>这是一个大型弹窗，适合展示更多内容。</p>
          <Input v-model="modalInput" label="输入框" placeholder="在弹窗中输入" />
          <p>更多内容...</p>
        </div>
      </Modal>

      <!-- 自定义弹窗 -->
      <Modal
        v-model:visible="showCustomModal"
        hide-footer
        @close="showCustomModal = false"
      >
        <template #header>
          <h3 class="text-lg font-semibold text-blue-600">自定义标题</h3>
        </template>
        
        <div class="py-4">
          <p>这是一个自定义弹窗，隐藏了默认底部按钮。</p>
          <div class="mt-6 flex justify-end gap-3">
            <Button variant="secondary" @click="showCustomModal = false">
              自定义取消
            </Button>
            <Button @click="showCustomModal = false">
              自定义确定
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Button, Input, Modal, Dropdown, Tag, Loading } from '@/components/ui'
import type { DropdownOption } from '@/components/ui'

// Button 演示数据
const buttonLoading = ref(false)

const toggleButtonLoading = () => {
  buttonLoading.value = true
  setTimeout(() => {
    buttonLoading.value = false
  }, 2000)
}

// Input 演示数据
const inputValue = ref('')
const inputWithIcon = ref('')
const inputWithError = ref('')
const passwordValue = ref('')
const numberValue = ref('')
const textWithCount = ref('')

// Dropdown 演示数据
const selectedValue = ref('')
const selectedValue2 = ref('')
const multipleValue = ref([])

const dropdownOptions: DropdownOption[] = [
  { label: '选项一', value: 'option1' },
  { label: '选项二', value: 'option2' },
  { label: '选项三', value: 'option3', disabled: true },
  { label: '选项四', value: 'option4', divided: true },
  { label: '选项五', value: 'option5' }
]

const getSelectedLabel = (value: string) => {
  const option = dropdownOptions.find(opt => opt.value === value)
  return option?.label || value
}

const handleDropdownChange = (value: any, option: DropdownOption | null) => {
  console.log('Dropdown changed:', value, option)
}

// Tag 演示数据
const tags = reactive([
  { id: 1, name: '前端', color: 'primary' as const },
  { id: 2, name: '后端', color: 'success' as const },
  { id: 3, name: '设计', color: 'warning' as const },
  { id: 4, name: '产品', color: 'danger' as const }
])

const removeTag = (id: number) => {
  const index = tags.findIndex(tag => tag.id === id)
  if (index > -1) {
    tags.splice(index, 1)
  }
}

// Modal 演示数据
const showModal = ref(false)
const showLargeModal = ref(false)
const showCustomModal = ref(false)
const modalInput = ref('')

const handleModalConfirm = () => {
  console.log('Modal confirmed')
  showModal.value = false
}
</script> 