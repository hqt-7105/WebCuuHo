<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store'
const authStore = useAuthStore()
</script>

<template>
  <div style="padding:80px 24px; text-align:center;">
    <h1 style="font-family:'Fraunces',serif; color:#142720;">RescuerView</h1>
    <p style="color:rgba(42,42,36,0.6);">Xin chào {{ authStore.user?.name }} — màn hình này đang được xây dựng.</p>
    <button class="btn btn-ghost" style="margin-top:16px;" @click="authStore.logout()">Đăng xuất</button>
  </div>
</template>