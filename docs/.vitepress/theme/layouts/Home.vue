<template>
  <DefaultTheme.Layout>
    <template #hero>
      <div class="vp-home-hero">
        <div class="avatar-wrapper">
          <img
            class="avatar"
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=JohnDoe"
            alt="Avatar"
          />
        </div>
        <h1 class="name">John Doe</h1>
        <p class="tagline">Full-Stack Developer & AI Enthusiast</p>
        <p class="description">
          Building elegant web experiences with Vue, TypeScript, and AI.
        </p>
        <div class="actions">
          <VPButton theme="brand" :href="$withBase('/cv')" size="big">
            <template #icon><span class="vp-icon icon-cv">📄</span></template>
            View My CV
          </VPButton>
          <VPButton theme="alt" :href="$withBase('/chat')" size="big">
            <template #icon><span class="vp-icon icon-chat">💬</span></template>
            Chat With Me
          </VPButton>
        </div>
      </div>
    </template>

    <template #features-after>
      <div class="home-features">
        <h2 class="section-title">Latest Posts</h2>
        <div class="feature-grid">
          <a href="/blog/getting-started" class="post-card">
            <div class="post-card-inner">
              <div class="post-date">May 20, 2026</div>
              <h3>Getting Started with VitePress</h3>
              <p>Learn how to build a personal site with VitePress, Vue components, and ant-design-x-vue.</p>
              <span class="read-more">Read more →</span>
            </div>
          </a>
        </div>
      </div>
    </template>
  </DefaultTheme.Layout>
</template>

<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { VPButton } from 'vitepress/theme'

defineOptions({ name: 'HomeLayout' })
</script>

<style scoped>
.vp-home-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 24px 24px;
}

.avatar-wrapper {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--vp-c-brand-1);
  box-shadow: 0 8px 32px var(--vp-c-brand-soft);
  margin-bottom: 24px;
  background: var(--vp-c-bg-soft);
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.name {
  font-size: 3rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--vp-c-brand-1), var(--vp-c-brand-2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px;
}

.tagline {
  font-size: 1.25rem;
  color: var(--vp-c-text-1);
  margin: 0 0 12px;
  font-weight: 500;
}

.description {
  font-size: 1rem;
  color: var(--vp-c-text-2);
  max-width: 480px;
  margin: 0 0 32px;
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.icon-cv,
.icon-chat {
  font-size: 1.2em;
}

.home-features {
  padding: 24px 24px 48px;
}

.section-title {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--vp-c-text-1);
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  max-width: 800px;
  margin: 0 auto;
}

.post-card {
  display: block;
  text-decoration: none;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
  background: var(--vp-c-bg-soft);
}

.post-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 16px var(--vp-c-brand-soft);
  transform: translateY(-2px);
}

.post-card-inner h3 {
  margin: 8px 0;
  font-size: 1.1rem;
  color: var(--vp-c-text-1);
}

.post-card-inner p {
  margin: 0 0 12px;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}

.post-date {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
}

.read-more {
  font-size: 0.85rem;
  color: var(--vp-c-brand-1);
  font-weight: 500;
}
</style>
