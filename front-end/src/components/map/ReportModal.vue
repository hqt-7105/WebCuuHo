<script setup lang="ts">
import { reactive } from 'vue'

interface ReportFormData {
  reqType: string
  phone: string
  description: string
}

const props = defineProps<{
  isOpen: boolean
  pickedLocationText: string
}>()

const emit = defineEmits<{
  close: []
  submit: [data: ReportFormData]
}>()

const form = reactive<ReportFormData>({
  reqType: '',
  phone: '',
  description: ''
})

function resetForm() {
  form.reqType = ''
  form.phone = ''
  form.description = ''
}

function handleSubmit() {
  emit('submit', { ...form })
  resetForm()
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <div class="modal-overlay" :class="{ open: props.isOpen }">
    <div class="modal-card">
      <div class="modal-head">
        <h3>Gửi báo cáo / yêu cầu cứu trợ</h3>
        <button class="modal-close" aria-label="Đóng" @click="handleClose">✕</button>
      </div>
      <form @submit.prevent="handleSubmit">
        <label>
          Loại yêu cầu *
          <select v-model="form.reqType" required>
            <option value="">— Chọn loại —</option>
            <option>Cần đến nơi an toàn</option>
            <option>Đi viện gấp</option>
            <option>Nhu yếu phẩm</option>
            <option>Thiết bị y tế</option>
            <option>Khác</option>
          </select>
        </label>
        <label>
          <br>
          Số điện thoại liên hệ *
          <input v-model="form.phone" type="tel" required placeholder="09xxxxxxxx">
        </label>
        <label>
          <br>
          Nội dung mô tả *
          <br>
          <textarea v-model="form.description" required rows="3" placeholder="Mô tả ngắn tình hình, số người cần hỗ trợ..."></textarea>
        </label>
        <label>
          <br>
          Vị trí
          <span class="hint">{{ pickedLocationText }}</span>
        </label>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="handleClose">Huỷ</button>
          <button type="submit" class="btn btn-primary">Gửi báo cáo</button>
        </div>
      </form>
    </div>
  </div>
</template>
