<template>
  <div class="cvit-home">
    <!-- Announcement Marquee Bar -->
    <div class="announce-bar" v-if="announcements.length">
      <div class="announce-track">
        <span
          v-for="(item, i) in [...announcements, ...announcements]"
          :key="i"
          class="announce-item"
        >
          <span class="announce-icon">•</span> {{ item }}
        </span>
      </div>
    </div>

    <!-- Hero Section - 4 Quadrant Grid -->
    <section class="hero">
      <div class="hero-grid">
        <!-- Top-Left: Identity -->
        <div class="quadrant q-identity">
          <p class="hero-label">PORTFOLIO</p>
          <h1 class="hero-name">ZHAO LONGJIE</h1>
          <p class="hero-role">企业数字化产品专家</p>
          <div class="hero-actions">
            <a href="/cv" class="btn-primary">VIEW MY CV</a>
            <a href="/chat" class="btn-outline">LET'S TALK</a>
          </div>
        </div>

        <!-- Top-Right: Avatar -->
        <div class="quadrant q-avatar">
          <div class="hero-image-placeholder">
            <img
              src="https://api.dicebear.com/7.x/bottts/svg?seed=JohnsonZhao"
              alt="赵龙杰"
              class="hero-avatar"
            />
          </div>
        </div>

        <!-- Bottom-Left: Experience -->
        <div class="quadrant q-experience">
          <h2 class="quad-heading">
            <span class="heading-line"></span>
            EXPERIENCE
          </h2>
          <div class="timeline">
            <div v-for="exp in experiences" :key="exp.company" class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-body">
                <span class="timeline-role">{{ exp.role }}</span>
                <span class="timeline-company">{{ exp.company }}</span>
                <span class="timeline-period">{{ exp.period }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom-Right: About -->
        <div class="quadrant q-about">
          <h2 class="quad-heading">
            <span class="heading-line"></span>
            ABOUT ME
          </h2>
          <p class="about-text">
            10 年产品研发经验，在企业数字化架构和团队管理方面展现了卓越的领导能力和创新精神。敏捷联盟认证敏捷教练，擅长推动团队完成技术转型和流程优化，实现复杂项目的顺利推进。
          </p>
          <div class="about-stats">
            <div v-for="stat in stats" :key="stat.label" class="stat-item">
              <span class="stat-value">{{ stat.value }}</span>
              <span class="stat-label">{{ stat.label }}</span>
            </div>
          </div>
          <div class="skills-inline">
            <span v-for="skill in skills" :key="skill.name" class="skill-tag">{{ skill.name }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Skills Progress Bar Section -->
    <section class="skills-section">
      <div class="section-inner">
        <h1 class="section-heading">
          <span class="heading-line"></span>
          SKILLS
        </h1>
        <h2 class="section-heading">
          <span class="heading-line"></span>
          技能曾是一道墙，如今是一扇门——门后不是你会什么，而是你想去往哪里。
        </h2>
      </div>
    </section>

    <!-- Posts Section -->
    <section class="posts-section">
      <div class="section-inner">
        <h2 class="section-heading centered">
          <span class="heading-line"></span>
          LATEST POSTS
        </h2>
        <div class="posts-grid">
          <a v-for="post in posts" :key="post.title" :href="post.href" class="post-card">
            <div class="post-image-placeholder">
              <img v-if="post.cover" :src="post.cover" :alt="post.title" class="post-cover" />
            </div>
            <div class="post-body">
              <div class="post-date">{{ post.date }}</div>
              <h3 class="post-title">{{ post.title }}</h3>
              <p class="post-excerpt">{{ post.excerpt }}</p>
              <span class="post-link">Read more →</span>
            </div>
          </a>
        </div>
      </div>
    </section>

    <!-- Footer CTA -->
    <section class="footer-cta">
      <div class="cta-inner">
        <h2 class="cta-heading">READY TO BUILD TOGETHER?</h2>
        <p class="cta-sub">Let's create something great.</p>
        <a href="/chat" class="btn-primary btn-large">LET'S TALK</a>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'HomeLayout' })

const announcements = [
  '10 年产品研发经验，专注于企业数字化架构与敏捷转型',
  '敏捷联盟认证敏捷教练',
  '低代码平台从 0 到 1 建设者',
]

const skills = [
  { name: '产品设计', level: 95 },
  { name: '敏捷教练', level: 90 },
  { name: 'C#/.Net', level: 85 },
  { name: 'Node.js', level: 80 },
  { name: 'SQL', level: 75 },
  { name: 'AI 智能体', level: 70 },
]

const stats = [
  { value: '10+', label: 'Years Exp.' },
  { value: '8+', label: 'Major Projects' },
  { value: '200+', label: 'Team Led' },
]

const experiences = [
  {
    role: '产品经理 / 敏捷教练',
    company: '统一认证平台',
    period: '2025 — Present',
  },
  {
    role: '产品经理',
    company: 'BeEver 低代码中台',
    period: '2025 — Present',
  },
  {
    role: '技术产品经理',
    company: '房屋维修 SaaS / AI 问卷',
    period: '2024 — 2025',
  },
  {
    role: '产品负责人',
    company: '自研低代码平台',
    period: '2021 — 2024',
  },
  {
    role: '敏捷教练',
    company: '公共服务组转型',
    period: '2020 — 2021',
  },
]

const postModules = import.meta.glob('../../blog/*.md', { eager: true }) as Record<
  string,
  { frontmatter: { title?: string; date?: string; description?: string; cover?: string } }
>

const posts = Object.entries(postModules)
  .map(([path, mod]) => {
    const slug = path.replace('../../blog/', '').replace('.md', '')
    const fm = mod.frontmatter ?? {}
    return {
      href: `/blog/${slug}`,
      date: fm.date ?? '',
      title: fm.title ?? slug,
      excerpt: fm.description ?? '',
      cover: fm.cover ?? '',
    }
  })
  .filter((p) => p.title)
  .sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    return b.date.localeCompare(a.date)
  })
</script>

<style scoped>
/* ===== ANNOUNCEMENT MARQUEE BAR ===== */
.announce-bar {
  height: 50px;
  background: var(--color-bg-dark);
  overflow: hidden;
  position: relative;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.announce-track {
  display: flex;
  align-items: center;
  height: 100%;
  white-space: nowrap;
  animation: marquee 30s linear infinite;
  gap: 0;
}

.announce-item {
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  color: var(--color-text-inverse);
  text-transform: uppercase;
  padding: 0 48px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.announce-icon {
  font-size: 1rem;
  opacity: 0.5;
}

@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

/* ===== HERO: 4-QUADRANT GRID ===== */
.hero {
  border-bottom: 1px solid var(--color-border);
}

.hero-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  min-height: calc(100vh - 65px - 50px);
}

/* ---- Quadrant shared ---- */
.quadrant {
  padding: 40px 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.quadrant:not(:last-child) {
  border-right: 1px solid var(--color-border);
}

.quad-heading {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.3em;
  color: var(--color-text-secondary);
  margin: 0 0 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  text-transform: uppercase;
}

/* ---- Top-Left: Identity ---- */
.q-identity {
  background: var(--color-bg-main);
}

.hero-label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.35em;
  color: var(--color-text-secondary);
  margin: 0 0 12px;
  text-transform: uppercase;
}

.hero-name {
  font-size: clamp(2.5rem, 4vw, 3.5rem);
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0 0 4px;
  letter-spacing: -0.01em;
  line-height: 1;
  text-transform: uppercase;
}

.hero-role {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-primary);
  margin: 0 0 28px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.hero-actions {
  display: flex;
  gap: 0;
  flex-wrap: wrap;
}

/* ---- Top-Right: Avatar ---- */
.q-avatar {
  padding: 40px;
  align-items: center;
  background: var(--color-bg-surface);
}

.hero-image-placeholder {
  width: 100%;
  max-width: 380px;
  aspect-ratio: 1;
  background: var(--color-bg-main);
  border: 2px solid var(--color-border);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
}

.hero-avatar {
  width: 92%;
  height: 92%;
  object-fit: cover;
  display: block;
}

/* ---- Bottom-Left: Experience ---- */
.q-experience {
  background: var(--color-bg-main);
  border-top: 1px solid var(--color-border);
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.timeline-dot {
  width: 8px;
  height: 8px;
  background: var(--color-bg-dark);
  border: 1px solid var(--color-bg-dark);
  flex-shrink: 0;
  margin-top: 6px;
}

.timeline-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.timeline-role {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.timeline-company {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.timeline-period {
  font-size: 0.72rem;
  font-weight: 400;
  color: var(--color-text-secondary);
  letter-spacing: 0.04em;
}

/* ---- Bottom-Right: About ---- */
.q-about {
  background: var(--color-bg-surface);
  border-top: 1px solid var(--color-border);
}

.about-text {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  line-height: 1.75;
  margin: 0 0 28px;
}

.about-stats {
  display: flex;
  gap: 36px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.skills-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill-tag {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 4px 10px;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

/* ===== BUTTONS ===== */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 28px;
  background: var(--color-bg-dark);
  color: var(--color-text-inverse);
  text-decoration: none;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  border: 2px solid var(--color-bg-dark);
  transition: background 0.2s, color 0.2s;
}

.btn-primary:hover {
  background: var(--color-text-primary);
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 28px;
  background: transparent;
  color: var(--color-text-primary);
  text-decoration: none;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  border: 2px solid var(--color-text-primary);
  transition: background 0.2s, color 0.2s;
}

.btn-outline:hover {
  background: var(--color-text-primary);
  color: var(--color-text-inverse);
}

.btn-large {
  padding: 18px 48px;
  font-size: 0.85rem;
}

/* ===== SECTION SHARED ===== */
.section-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 48px;
}

.section-heading {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.3em;
  color: var(--color-text-secondary);
  margin: 0 0 40px;
  display: flex;
  align-items: center;
  gap: 12px;
  text-transform: uppercase;
}

.section-heading.centered {
  justify-content: center;
}

.heading-line {
  display: inline-block;
  width: 36px;
  height: 2px;
  background: var(--color-text-secondary);
  flex-shrink: 0;
}

/* ===== SKILLS SECTION ===== */
.skills-section {
  padding: 64px 0;
  background: var(--color-bg-main);
}

.skills-bars {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px 60px;
}

.skill-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skill-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.skill-percent {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.skill-track {
  width: 100%;
  height: 6px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.skill-fill {
  height: 100%;
  background: var(--color-bg-dark);
  transition: width 0.8s ease;
}

/* ===== POSTS ===== */
.posts-section {
  padding: var(--spacing-section-y) 0;
  background: var(--color-bg-surface);
  border-top: 1px solid var(--color-border);
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.post-card {
  display: block;
  text-decoration: none;
  background: var(--color-bg-main);
  border: 1px solid var(--color-border);
  transition: border-color 0.2s, transform 0.2s;
  overflow: hidden;
}

.post-card:hover {
  border-color: var(--color-text-primary);
  transform: translateY(-4px);
}

.post-image-placeholder {
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
}

.post-image-placeholder:not(:has(.post-cover)) {
  background: var(--color-bg-dark);
  opacity: 0.08;
}

.post-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-body {
  padding: 24px;
}

.post-date {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
}

.post-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.post-excerpt {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0 0 16px;
}

.post-link {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* ===== FOOTER CTA ===== */
.footer-cta {
  padding: var(--spacing-section-y) 0;
  background: var(--color-bg-dark);
}

.cta-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 48px;
  text-align: center;
}

.cta-heading {
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  font-weight: 800;
  color: var(--color-text-inverse);
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.cta-sub {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 40px;
}

.footer-cta .btn-primary {
  background: var(--color-text-inverse);
  color: var(--color-bg-dark);
  border-color: var(--color-text-inverse);
}

.footer-cta .btn-primary:hover {
  background: #e0e0e0;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 900px) {
  .hero-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    min-height: unset;
  }

  .quadrant {
    padding: 32px 24px;
    border-right: none !important;
    border-bottom: 1px solid var(--color-border);
  }

  .q-avatar {
    align-items: center;
  }

  .hero-image-placeholder {
    max-width: 260px;
  }

  .skills-bars {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .section-inner {
    padding: 0 24px;
  }

  .cta-inner {
    padding: 0 24px;
  }

  .posts-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 600px) {
  .posts-grid {
    grid-template-columns: 1fr;
  }

  .about-stats {
    gap: 24px;
  }

  .about-stats .stat-value {
    font-size: 1.5rem;
  }
}
</style>
