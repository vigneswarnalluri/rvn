import '@fontsource/cabin/400.css';
import '@fontsource/cabin/500.css';
import '@fontsource/cabin/600.css';
import '@fontsource/cabin/700.css';
import '../styles/app.css';

import {
  Apple,
  Archive,
  ArrowUpRight,
  BadgePercent,
  BarChart3,
  Beef,
  Bell,
  Bone,
  Carrot,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Code,
  Coffee,
  CreditCard,
  Database,
  DollarSign,
  Download,
  Eye,
  Fish,
  FolderPlus,
  LayoutDashboard,
  ListTree,
  Menu,
  MessageCircle,
  Milk,
  Moon,
  Package,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  Sandwich,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Snowflake,
  Star,
  Store,
  Sun,
  Trash2,
  Truck,
  Upload,
  UserPlus,
  Users,
  Wheat,
  X,
  Calendar,
  ChevronsUpDown,
  Folder,
  GripVertical,
  HelpCircle,
  History,
  Inbox,
  Layers,
  LogOut,
  Zap,
  Globe,
  Image,
  LifeBuoy,
  List,
  PanelLeft,
  Receipt,
  Box,
  PackagePlus,
  ArrowLeft,
  Mail,
  Phone,
  User,
  FileText,
  Gift,
  ChevronLeft,
  createIcons,
} from 'lucide';

/**
 * RVN admin – main script.
 * Organised as a single namespaced module (rbtJs) following the project's
 * house JS pattern: `i()` boots it, `d()` caches shared DOM, `methods()`
 * fans out to each feature initialiser. Kept framework-free (no jQuery) so the
 * tree-shaken lucide/echarts imports and Vite bundling stay intact.
 */
(function (window, document, undefined) {
  'use strict';

  const LUCIDE_ICONS = {
    Apple,
    Archive,
    ArrowUpRight,
    BadgePercent,
    BarChart3,
    Beef,
    Bell,
    Bone,
    Carrot,
    Check,
    ChevronDown,
    ChevronRight,
    CircleAlert,
    Code,
    Coffee,
    CreditCard,
    Database,
    DollarSign,
    Download,
    Eye,
    Fish,
    FolderPlus,
    LayoutDashboard,
    ListTree,
    Menu,
    MessageCircle,
    Milk,
    Moon,
    Package,
    Pencil,
    Plus,
    RefreshCcw,
    Save,
    Sandwich,
    Search,
    Settings,
    Shield,
    ShieldCheck,
    ShoppingBag,
    SlidersHorizontal,
    Snowflake,
    Star,
    Store,
    Sun,
    Trash2,
    Truck,
    Upload,
    UserPlus,
    Users,
    Wheat,
    X,
    Calendar,
    ChevronsUpDown,
    Folder,
    GripVertical,
    HelpCircle,
    History,
    Inbox,
    Layers,
    LogOut,
    Zap,
    Globe,
    Image,
    LifeBuoy,
    List,
    PanelLeft,
    Receipt,
    Box,
    PackagePlus,
    ArrowLeft,
    Mail,
    Phone,
    User,
    FileText,
    Gift,
    ChevronLeft,
  };

  const rbtJs = {
    /* cached DOM (populated in d()) */
    _body: null,
    _sidebar: null,
    _overlay: null,
    _sidebarButtons: null,
    _themeToggle: null,
    _root: null,

    /* ---------- boot ---------- */
    i: function () {
      rbtJs.d();
      rbtJs.methods();
    },

    d: function () {
      this._body = document.body;
      this._sidebar = document.querySelector('[data-sidebar]');
      this._overlay = document.querySelector('[data-sidebar-overlay]');
      this._sidebarButtons = document.querySelectorAll('[data-sidebar-toggle]');
      this._themeToggle = document.querySelector('[data-theme-toggle]');
      this._root = document.documentElement;
    },

    methods: function () {
      rbtJs.lucideInit();
      rbtJs.sidebarToggle();
      rbtJs.activeNav();
      rbtJs.collapsibleSidebar();
      rbtJs.transitionsReady();
      rbtJs.popoverMenus();
      rbtJs.navAccordion();
      rbtJs.modals();
      rbtJs.formTabs();
      rbtJs.drawers();
      rbtJs.themeInit();
      rbtJs.charts();
      rbtJs.todoList();
      rbtJs.modernSelects();
      rbtJs.preloaderInit();
      rbtJs.categorySlider();
      rbtJs.listTables();
    },

    /* ---------- shared helpers ---------- */
    renderLucideIcons: function () {
      document.querySelectorAll('svg[data-lucide]').forEach((icon) => icon.removeAttribute('data-lucide'));
      createIcons({ icons: LUCIDE_ICONS });
      document.querySelectorAll('svg[data-lucide]').forEach((icon) => icon.removeAttribute('data-lucide'));
    },

    getModal: function (name) {
      return document.querySelector(`[data-modal="${name}"]`);
    },

    openModal: function (modal, trigger) {
      if (!modal) return;
      const panel = modal.querySelector('[data-modal-panel]');
      const backdrop = modal.querySelector('[data-modal-backdrop]');
      const message = modal.querySelector('[data-modal-message]');

      // Let a trigger customize the message and remember its target row.
      if (trigger?.dataset.modalMessage && message) {
        message.textContent = trigger.dataset.modalMessage;
      }
      modal.targetRow = trigger?.closest('[data-row], tr') || null;
      modal.bulkRows = null;

      modal.classList.remove('hidden');
      modal.classList.add('flex');
      requestAnimationFrame(() => {
        backdrop?.classList.replace('opacity-0', 'opacity-100');
        panel?.classList.replace('opacity-0', 'opacity-100');
        panel?.classList.replace('scale-95', 'scale-100');
      });
    },

    closeModal: function (modal) {
      if (!modal) return;
      const panel = modal.querySelector('[data-modal-panel]');
      const backdrop = modal.querySelector('[data-modal-backdrop]');
      backdrop?.classList.replace('opacity-100', 'opacity-0');
      panel?.classList.replace('opacity-100', 'opacity-0');
      panel?.classList.replace('scale-100', 'scale-95');
      setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }, 300);
    },

    applyTheme: function (theme) {
      const themeToggle = rbtJs._themeToggle;
      const root = rbtJs._root;
      const isDark = theme === 'dark';
      // Switch instantly — suppress color transitions for one frame so the whole
      // UI doesn't slowly fade when toggling light/dark.
      root.classList.add('no-theme-transition');
      root.classList.toggle('dark', isDark);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => root.classList.remove('no-theme-transition'));
      });
      window.dispatchEvent(new CustomEvent('themechange', { detail: { dark: isDark } }));
      if (themeToggle) {
        themeToggle.setAttribute('aria-pressed', String(isDark));
        themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        themeToggle.innerHTML = `<i data-lucide="${isDark ? 'sun' : 'moon'}" class="h-5 w-5"></i>`;
        rbtJs.renderLucideIcons();
      }
    },

    /* ---------- features ---------- */
    lucideInit: function () {
      rbtJs.renderLucideIcons();
      window.__renderLucideIcons = rbtJs.renderLucideIcons;
    },

    sidebarToggle: function () {
      const body = rbtJs._body;
      const sidebar = rbtJs._sidebar;
      const overlay = rbtJs._overlay;
      const sidebarButtons = rbtJs._sidebarButtons;

      function setSidebar(open) {
        body.dataset.sidebarOpen = String(open);
        sidebar?.classList.toggle('-translate-x-full', !open);
        overlay?.classList.toggle('hidden', !open);
        sidebarButtons.forEach((button) => button.setAttribute('aria-expanded', String(open)));
      }

      sidebarButtons.forEach((button) => {
        button.addEventListener('click', () => {
          setSidebar(body.dataset.sidebarOpen !== 'true');
        });
      });

      overlay?.addEventListener('click', () => setSidebar(false));

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && body.dataset.sidebarOpen === 'true') {
          setSidebar(false);
        }
      });
    },

    activeNav: function () {
      const body = rbtJs._body;
      document.querySelectorAll('[data-nav]').forEach((link) => {
        const isActive = link.dataset.nav === body.dataset.page;
        link.classList.toggle('bg-surface-muted', isActive);
        link.classList.toggle('text-ink-900', isActive);
        link.classList.toggle('font-semibold', isActive);
      });
    },

    collapsibleSidebar: function () {
      const COLLAPSE_KEY = 'RVN-sidebar-collapsed';
      const collapseBtn = document.querySelector('[data-sidebar-collapse]');
      const rootEl = rbtJs._root;

      // State is applied pre-paint in <head>; here we just keep it in sync as a fallback.
      if (localStorage.getItem(COLLAPSE_KEY) === '1') {
        rootEl.classList.add('sidebar-collapsed');
      }

      collapseBtn?.addEventListener('click', () => {
        const collapsed = rootEl.classList.toggle('sidebar-collapsed');
        localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
      });
    },

    transitionsReady: function () {
      const rootEl = rbtJs._root;
      // Enable sidebar/content transitions only AFTER first paint so the layout
      // doesn't animate (and charts don't mis-measure) on page load.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => rootEl.classList.add('sidebar-ready'));
      });
    },

    popoverMenus: function () {
      function closeAllMenus() {
        document.querySelectorAll('[data-menu]').forEach((menu) => menu.classList.add('hidden'));
        document.querySelectorAll('[data-menu-toggle]').forEach((trigger) => {
          trigger.setAttribute('aria-expanded', 'false');
        });
      }

      document.querySelectorAll('[data-menu-toggle]').forEach((trigger) => {
        trigger.setAttribute('aria-expanded', 'false');
        trigger.addEventListener('click', (event) => {
          event.stopPropagation();
          const menu = document.querySelector(`[data-menu="${trigger.dataset.menuToggle}"]`);
          const willOpen = menu?.classList.contains('hidden');
          closeAllMenus();
          if (willOpen) {
            menu.classList.remove('hidden');
            trigger.setAttribute('aria-expanded', 'true');
          }
        });
      });

      document.addEventListener('click', (event) => {
        if (!event.target.closest('[data-menu]') && !event.target.closest('[data-menu-toggle]')) {
          closeAllMenus();
        }
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeAllMenus();
      });
    },

    navAccordion: function () {
      const body = rbtJs._body;

      function openNavGroup(group, open) {
        const submenu = group.querySelector('[data-nav-submenu]');
        const chevron = group.querySelector('[data-nav-chevron]');
        const trigger = group.querySelector('[data-nav-trigger]');
        group.dataset.open = String(open);
        submenu?.classList.toggle('grid-rows-[1fr]', open);
        submenu?.classList.toggle('grid-rows-[0fr]', !open);
        chevron?.classList.toggle('rotate-90', open);
        trigger?.setAttribute('aria-expanded', String(open));
      }

      document.querySelectorAll('[data-nav-group]').forEach((group) => {
        const trigger = group.querySelector('[data-nav-trigger]');
        trigger?.addEventListener('click', () => {
          openNavGroup(group, group.dataset.open !== 'true');
        });

        // Auto-expand the group that contains the current page.
        const activeChild = group.querySelector(`[data-nav="${body.dataset.page}"]`);
        if (activeChild) {
          openNavGroup(group, true);
          activeChild.classList.add('bg-surface-muted', 'text-ink-900', 'font-semibold');
        }
      });
    },

    modals: function () {
      const getModal = rbtJs.getModal;
      const openModal = rbtJs.openModal;
      const closeModal = rbtJs.closeModal;

      document.querySelectorAll('[data-modal-open]').forEach((trigger) => {
        trigger.addEventListener('click', (event) => {
          event.preventDefault();
          openModal(getModal(trigger.dataset.modalOpen), trigger);
        });
      });

      document.querySelectorAll('[data-modal]').forEach((modal) => {
        modal.querySelectorAll('[data-modal-close]').forEach((btn) => {
          btn.addEventListener('click', () => closeModal(modal));
        });
        modal.querySelector('[data-modal-backdrop]')?.addEventListener('click', () => closeModal(modal));

        // Confirm action: remove the targeted row(s) (demo behavior) then close.
        modal.querySelector('[data-modal-confirm]')?.addEventListener('click', () => {
          const rows = modal.bulkRows?.length ? modal.bulkRows.slice() : modal.targetRow ? [modal.targetRow] : [];
          rows.forEach((row) => {
            row.style.transition = 'opacity 0.2s';
            row.style.opacity = '0';
            setTimeout(() => row.remove(), 200);
          });
          modal.bulkRows = null;
          closeModal(modal);
          if (rows.length)
            setTimeout(() => {
              window.__afterProductChange?.();
              (window.__listRefreshers || []).forEach((fn) => fn());
            }, 260);
        });
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          document.querySelectorAll('[data-modal]:not(.hidden)').forEach((modal) => closeModal(modal));
        }
      });
    },

    formTabs: function () {
      document.querySelectorAll('[data-form-tabs]').forEach((tabsRoot) => {
        const tabs = Array.from(tabsRoot.querySelectorAll('[data-form-tab]'));
        const panels = Array.from(tabsRoot.querySelectorAll('[data-form-panel]'));
        if (!tabs.length || !panels.length) return;

        function setActive(tabName) {
          tabs.forEach((tab) => {
            const active = tab.dataset.formTab === tabName;
            tab.setAttribute('aria-selected', String(active));
            tab.classList.toggle('border-brand-600', active);
            tab.classList.toggle('bg-brand-600', active);
            tab.classList.toggle('text-white', active);
            tab.classList.toggle('shadow-card', active);
            tab.classList.toggle('border-surface-line', !active);
            tab.classList.toggle('bg-surface-card', !active);
            tab.classList.toggle('text-ink-600', !active);
          });

          panels.forEach((panel) => {
            panel.classList.toggle('hidden', panel.dataset.formPanel !== tabName);
          });
        }

        tabs.forEach((tab) => {
          tab.addEventListener('click', () => setActive(tab.dataset.formTab));
        });

        const selected = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0];
        setActive(selected.dataset.formTab);
      });
    },

    drawers: function () {
      function getDrawer(name) {
        return document.querySelector(`[data-drawer="${name}"]`);
      }

      function openDrawer(drawer) {
        if (!drawer) return;
        const panel = drawer.querySelector('[data-drawer-panel]');
        const backdrop = drawer.querySelector('[data-drawer-backdrop]');

        drawer.classList.remove('hidden');
        drawer.classList.add('flex');
        document.body.classList.add('overflow-hidden');

        requestAnimationFrame(() => {
          backdrop?.classList.replace('opacity-0', 'opacity-100');
          panel?.classList.replace('translate-x-full', 'translate-x-0');
        });
      }

      function closeDrawer(drawer) {
        if (!drawer) return;
        const panel = drawer.querySelector('[data-drawer-panel]');
        const backdrop = drawer.querySelector('[data-drawer-backdrop]');

        backdrop?.classList.replace('opacity-100', 'opacity-0');
        panel?.classList.replace('translate-x-0', 'translate-x-full');

        setTimeout(() => {
          drawer.classList.add('hidden');
          drawer.classList.remove('flex');
          if (!document.querySelector('[data-drawer]:not(.hidden)')) {
            document.body.classList.remove('overflow-hidden');
          }
        }, 250);
      }

      document.querySelectorAll('[data-drawer-open]').forEach((trigger) => {
        trigger.addEventListener('click', (event) => {
          event.preventDefault();
          openDrawer(getDrawer(trigger.dataset.drawerOpen));
        });
      });

      document.querySelectorAll('[data-drawer]').forEach((drawer) => {
        drawer.querySelectorAll('[data-drawer-close]').forEach((button) => {
          button.addEventListener('click', () => closeDrawer(drawer));
        });
        drawer.querySelector('[data-drawer-backdrop]')?.addEventListener('click', () => closeDrawer(drawer));
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          document.querySelectorAll('[data-drawer]:not(.hidden)').forEach((drawer) => closeDrawer(drawer));
        }
      });
    },

    themeInit: function () {
      const THEME_KEY = 'RVN-theme';
      const root = rbtJs._root;
      const themeToggle = rbtJs._themeToggle;

      rbtJs.applyTheme(localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light');

      themeToggle?.addEventListener('click', () => {
        const next = root.classList.contains('dark') ? 'light' : 'dark';
        localStorage.setItem(THEME_KEY, next);
        rbtJs.applyTheme(next);
      });
    },

    charts: function () {
      const revenueEl = document.querySelector('#revenueChart');
      const earningEl = document.querySelector('#earningChart');
      const visitorsEl = document.querySelector('#visitorsChart');
      const sales3DEl = document.querySelector('#sales3DChart');

      const chartEls = [revenueEl, earningEl, visitorsEl, sales3DEl].filter(Boolean);
      if (!chartEls.length) return;

      // Defer the (heavy) ECharts import + render until a chart scrolls near the
      // viewport, keeping the chart bundles off the critical path on first paint.
      let started = false;
      const start = () => {
        if (started) return;
        started = true;
        rbtJs.buildCharts(revenueEl, earningEl, visitorsEl, sales3DEl);
      };

      if (typeof IntersectionObserver !== 'undefined') {
        const io = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
              io.disconnect();
              start();
            }
          },
          { rootMargin: '300px 0px' },
        );
        chartEls.forEach((el) => io.observe(el));
      } else {
        start();
      }
    },

    buildCharts: async function (revenueEl, earningEl, visitorsEl, sales3DEl) {
      const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      // Apache ECharts — modular import keeps the bundle lean.
      const echarts = await import('echarts/core');
      const { LineChart, PieChart, BarChart } = await import('echarts/charts');
      const {
        GridComponent,
        TooltipComponent,
        LegendComponent,
        MarkLineComponent,
        MarkPointComponent,
        VisualMapComponent,
      } = await import('echarts/components');
      const { CanvasRenderer } = await import('echarts/renderers');
      echarts.use([
        LineChart,
        PieChart,
        BarChart,
        GridComponent,
        TooltipComponent,
        LegendComponent,
        MarkLineComponent,
        MarkPointComponent,
        VisualMapComponent,
        CanvasRenderer,
      ]);

      const isDark = () => document.documentElement.classList.contains('dark');
      const labelColor = () => (isDark() ? '#94a3b8' : '#8a8a8a');
      const splitColor = () => (isDark() ? 'rgba(148,163,184,0.14)' : 'rgba(136,136,136,0.16)');
      const cardBg = () => (isDark() ? '#181d29' : '#ffffff');
      const grad = (c1, c2) =>
        new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: c1 },
          { offset: 1, color: c2 },
        ]);
      // Horizontal gradient (for line strokes).
      const grad2 = (c1, c2) =>
        new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: c1 },
          { offset: 1, color: c2 },
        ]);
      const tooltipBase = (trigger) => ({
        trigger,
        backgroundColor: isDark() ? '#0f131c' : '#ffffff',
        borderColor: isDark() ? '#2f374a' : '#e6e6e6',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: isDark() ? '#cbd5e1' : '#333333', fontFamily: 'Cabin', fontSize: 13 },
        extraCssText: 'border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,0.12);',
      });
      const axis = (categories) => ({
        type: 'category',
        boundaryGap: false,
        data: categories,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: labelColor(), fontFamily: 'Cabin' },
      });
      const valueAxis = (extra = {}) => ({
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: labelColor(), fontFamily: 'Cabin', ...(extra.axisLabel || {}) },
        splitLine: { lineStyle: { color: splitColor(), type: 'dashed' } },
      });

      const charts = [];
      const painters = [];

      /* ---- Revenue (gradient area + Year/Month toggle) ---- */
      if (revenueEl) {
        const revenueChart = echarts.init(revenueEl, null, { renderer: 'canvas' });
        charts.push(revenueChart);

        const ranges = {
          year: { categories: MONTHS, data: [58, 60, 66, 68, 59, 52, 51, 49, 41, 72, 108, 106] },
          month: { categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], data: [42, 55, 48, 67] },
        };
        let current = ranges.year;

        const paintRevenue = () =>
          revenueChart.setOption(
            {
              grid: { left: 44, right: 0, top: 24, bottom: 26, containLabel: false },
              tooltip: {
                ...tooltipBase('axis'),
                valueFormatter: (v) => `₹${v}k`,
                axisPointer: {
                  type: 'line',
                  lineStyle: { color: '#0da487', width: 1, type: 'dashed' },
                  label: { show: false },
                },
              },
              xAxis: { ...axis(current.categories), axisPointer: { snap: true } },
              yAxis: valueAxis({ axisLabel: { formatter: '₹{value}' } }),
              series: [
                {
                  name: 'Revenue',
                  type: 'line',
                  smooth: true,
                  showSymbol: false,
                  symbol: 'circle',
                  symbolSize: 9,
                  data: current.data,
                  // Gradient stroke with a soft glow under the line.
                  lineStyle: {
                    width: 3.5,
                    color: grad2('#22c3a6', '#0da487'),
                    shadowColor: 'rgba(13,164,135,0.35)',
                    shadowBlur: 14,
                    shadowOffsetY: 8,
                  },
                  itemStyle: { color: '#0da487', borderColor: cardBg(), borderWidth: 2 },
                  emphasis: { focus: 'series', scale: 1.6 },
                  areaStyle: { color: grad('rgba(13,164,135,0.30)', 'rgba(13,164,135,0.01)') },
                  // Average reference line — quick context on where months sit.
                  markLine: {
                    silent: true,
                    symbol: 'none',
                    lineStyle: { color: isDark() ? '#64748b' : '#cbd5e1', type: 'dashed', width: 1 },
                    label: {
                      formatter: 'Avg ₹{c}',
                      position: 'insideEndTop',
                      color: labelColor(),
                      fontFamily: 'Cabin',
                      fontSize: 11,
                    },
                    data: [{ type: 'average' }],
                  },
                  // Highlight the peak month.
                  markPoint: {
                    symbol: 'circle',
                    symbolSize: 9,
                    itemStyle: { color: '#0da487', borderColor: cardBg(), borderWidth: 2 },
                    label: {
                      formatter: '₹{@[1]}k',
                      position: 'top',
                      color: '#0da487',
                      fontFamily: 'Cabin',
                      fontWeight: 600,
                      fontSize: 11,
                    },
                    data: [{ type: 'max' }],
                  },
                },
              ],
            },
            { notMerge: true },
          );
        paintRevenue();
        painters.push(paintRevenue);

        const revenueToggle = document.querySelector('[data-revenue-toggle]');
        revenueToggle?.querySelectorAll('[data-range]').forEach((btn) => {
          btn.addEventListener('click', () => {
            if (!ranges[btn.dataset.range]) return;
            current = ranges[btn.dataset.range];
            revenueToggle.querySelectorAll('[data-range]').forEach((b) => {
              const active = b === btn;
              b.classList.toggle('bg-surface-card', active);
              b.classList.toggle('text-brand-600', active);
              b.classList.toggle('shadow-card', active);
            });
            paintRevenue();
          });
        });
      }

      /* ---- Earning (two smooth lines) ---- */
      if (earningEl) {
        const earningChart = echarts.init(earningEl, null, { renderer: 'canvas' });
        charts.push(earningChart);
        const paintEarning = () =>
          earningChart.setOption(
            {
              grid: { left: 40, right: 0, top: 36, bottom: 26, containLabel: false },
              tooltip: {
                ...tooltipBase('axis'),
                valueFormatter: (v) => `₹${v}k`,
                axisPointer: {
                  type: 'line',
                  lineStyle: { color: isDark() ? '#64748b' : '#cbd5e1', width: 1, type: 'dashed' },
                },
              },
              legend: {
                show: true,
                top: 0,
                right: 0,
                icon: 'roundRect',
                itemWidth: 14,
                itemHeight: 4,
                itemGap: 18,
                textStyle: { color: labelColor(), fontFamily: 'Cabin', fontSize: 12 },
                data: ['This Year', 'Last Year'],
              },
              color: ['#426de0', '#0da487'],
              xAxis: axis(MONTHS),
              yAxis: valueAxis({ axisLabel: { formatter: '₹{value}' } }),
              series: [
                {
                  name: 'This Year',
                  type: 'line',
                  smooth: true,
                  showSymbol: false,
                  symbol: 'circle',
                  symbolSize: 8,
                  data: [85, 58, 73, 99, 52, 47, 62, 49, 51, 81, 45, 47],
                  lineStyle: { width: 3, shadowColor: 'rgba(66,109,224,0.30)', shadowBlur: 10, shadowOffsetY: 6 },
                  itemStyle: { borderColor: cardBg(), borderWidth: 2 },
                  emphasis: { focus: 'series', scale: 1.6 },
                  areaStyle: { color: grad('rgba(66,109,224,0.18)', 'rgba(66,109,224,0)') },
                },
                {
                  name: 'Last Year',
                  type: 'line',
                  smooth: true,
                  showSymbol: false,
                  symbol: 'circle',
                  symbolSize: 8,
                  data: [62, 71, 48, 64, 79, 38, 44, 67, 33, 58, 70, 36],
                  lineStyle: { width: 3, shadowColor: 'rgba(13,164,135,0.30)', shadowBlur: 10, shadowOffsetY: 6 },
                  itemStyle: { borderColor: cardBg(), borderWidth: 2 },
                  emphasis: { focus: 'series', scale: 1.6 },
                  areaStyle: { color: grad('rgba(13,164,135,0.18)', 'rgba(13,164,135,0)') },
                },
              ],
            },
            { notMerge: true },
          );
        paintEarning();
        painters.push(paintEarning);
      }

      /* ---- Visitors (rounded donut) ---- */
      if (visitorsEl) {
        const visitorsChart = echarts.init(visitorsEl, null, { renderer: 'canvas' });
        charts.push(visitorsChart);
        const paintVisitors = () =>
          visitorsChart.setOption({
            tooltip: { ...tooltipBase('item'), formatter: '{b}: {c} ({d}%)' },
            legend: {
              bottom: 0,
              icon: 'circle',
              itemWidth: 9,
              itemHeight: 9,
              itemGap: 16,
              textStyle: { color: labelColor(), fontFamily: 'Cabin', fontSize: 12 },
            },
            series: [
              {
                type: 'pie',
                radius: ['60%', '82%'],
                center: ['50%', '44%'],
                avoidLabelOverlap: true,
                label: { show: false },
                labelLine: { show: false },
                itemStyle: { borderColor: cardBg(), borderWidth: 3, borderRadius: 8 },
                data: [
                  { value: 42, name: 'The Passersby', itemStyle: { color: '#24bd25' } },
                  { value: 28, name: 'The Occasionals', itemStyle: { color: '#f5b24f' } },
                  { value: 18, name: 'The Regulars', itemStyle: { color: '#9061f9' } },
                  { value: 12, name: 'The Superfans', itemStyle: { color: '#426de0' } },
                ],
              },
            ],
          });
        paintVisitors();
        painters.push(paintVisitors);
      }

      /* ---- Sales Analytics (2D / 3D, switched by the right-side select) ---- */
      if (sales3DEl) {
        const cats = ['Grocery', 'Bakery', 'Drinks', 'Snacks', 'Dairy', 'Frozen'];
        const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
        // Deterministic demo value for a given category/quarter.
        const val = (x, y) => 20 + ((x * 7 + y * 13 + x * y * 3) % 80);
        const quarterColors = ['#0da487', '#426de0', '#9061f9', '#ff8a3d'];

        // Flat data for the 3D bar: [catIndex, quarterIndex, value].
        const data3D = [];
        let max3D = 0;
        cats.forEach((_, x) =>
          quarters.forEach((__, y) => {
            const v = val(x, y);
            data3D.push([x, y, v]);
            if (v > max3D) max3D = v;
          }),
        );

        // echarts-gl side-effect registers its 3D types onto the full echarts build,
        // so we only pull it in when the 3D view is actually requested. Wrapped so a
        // GL/WebGL failure gracefully falls back to the 2D view.
        let echartsFull = null;
        let glFailed = false;
        const ensureGl = async () => {
          if (echartsFull || glFailed) return echartsFull;
          try {
            echartsFull = await import('echarts');
            await import('echarts-gl');
          } catch (e) {
            glFailed = true;
            echartsFull = null;
            window.__sales3dErr = String((e && e.stack) || e);
            console.warn('3D chart unavailable:', e);
          }
          return echartsFull;
        };

        const select = document.querySelector('#salesViewSelect');
        const hint = document.querySelector('[data-sales-hint]');
        let salesChart = null;
        let salesMode = (select && select.value) || '3d';

        const paint2D = () =>
          salesChart.setOption(
            {
              grid: { left: 44, right: 12, top: 34, bottom: 28, containLabel: false },
              tooltip: { ...tooltipBase('axis'), valueFormatter: (v) => `₹${v}k`, axisPointer: { type: 'shadow' } },
              legend: {
                show: true,
                top: 0,
                right: 0,
                icon: 'roundRect',
                itemWidth: 12,
                itemHeight: 8,
                itemGap: 14,
                textStyle: { color: labelColor(), fontFamily: 'Cabin', fontSize: 12 },
                data: quarters,
              },
              color: quarterColors,
              xAxis: { ...axis(cats), boundaryGap: true },
              yAxis: valueAxis({ axisLabel: { formatter: '₹{value}' } }),
              series: quarters.map((q, y) => ({
                name: q,
                type: 'bar',
                data: cats.map((_, x) => val(x, y)),
                barMaxWidth: 14,
                itemStyle: { borderRadius: [4, 4, 0, 0] },
                emphasis: { focus: 'series' },
              })),
            },
            { notMerge: true },
          );

        const paint3D = () =>
          salesChart.setOption(
            {
              tooltip: {
                ...tooltipBase('item'),
                formatter: (p) => `${cats[p.value[0]]} · ${quarters[p.value[1]]}<br/><b>₹${p.value[2]}k</b>`,
              },
              visualMap: {
                show: false,
                min: 0,
                max: max3D,
                inRange: { color: ['#22c3a6', '#426de0', '#9061f9', '#ff4c1a'] },
              },
              xAxis3D: {
                type: 'category',
                data: cats,
                axisLabel: { color: labelColor() },
                nameTextStyle: { color: labelColor() },
              },
              yAxis3D: { type: 'category', data: quarters, axisLabel: { color: labelColor() } },
              zAxis3D: { type: 'value', axisLabel: { color: labelColor() } },
              grid3D: {
                boxWidth: 110,
                boxDepth: 65,
                axisLine: { lineStyle: { color: splitColor() } },
                splitLine: { lineStyle: { color: splitColor() } },
                axisPointer: { lineStyle: { color: '#0da487' } },
                environment: 'auto',
                light: {
                  main: { intensity: 1.3, shadow: true, shadowQuality: 'medium', alpha: 30, beta: 40 },
                  ambient: { intensity: 0.35 },
                },
                viewControl: { autoRotate: true, autoRotateSpeed: 9, distance: 200, alpha: 22, beta: 35 },
              },
              series: [
                {
                  type: 'bar3D',
                  data: data3D,
                  shading: 'lambert',
                  bevelSize: 0.35,
                  bevelSmoothness: 4,
                  itemStyle: { opacity: 0.96 },
                  emphasis: { itemStyle: { color: '#ff4c1a' }, label: { show: false } },
                },
              ],
            },
            { notMerge: true },
          );

        // Re-applies the current mode's option (used by theme-change repaint).
        const paintSales = () => {
          if (!salesChart) return;
          if (salesMode === '3d') paint3D();
          else paint2D();
        };

        // 2D uses the lean core build; 3D needs the full GL build, so we dispose and
        // re-init the instance on the same container whenever the view changes.
        const renderSales = async (mode) => {
          let lib = echarts;
          if (mode === '3d') {
            const full = await ensureGl();
            if (full) {
              lib = full;
            } else {
              mode = '2d';
              if (select) select.value = '2d';
            }
          }
          salesMode = mode;
          if (salesChart) {
            salesChart.dispose();
            salesChart = null;
          }
          salesChart = lib.init(sales3DEl, null, { renderer: 'canvas' });
          if (hint) {
            hint.textContent =
              mode === '3d'
                ? 'Revenue by category across quarters — drag to rotate.'
                : 'Revenue by category, grouped by quarter.';
          }
          paintSales();
        };

        select?.addEventListener('change', (e) => renderSales(e.target.value));
        renderSales(salesMode);

        // Proxy so the shared resize/theme handlers always target the live instance.
        charts.push({
          getDom: () => sales3DEl,
          resize: (opt) => salesChart && salesChart.resize(opt),
        });
        painters.push(paintSales);
      }

      // Keep charts fully responsive. We explicitly resize each chart to its
      // container's real width/height so the canvas always fills its box (no white
      // gap), and a ResizeObserver fires on ANY container size change (device width,
      // sidebar collapse, grid reflow) — not just on window resize.
      const resizeAll = () => {
        charts.forEach((c) => {
          const dom = c.getDom();
          if (dom && dom.clientWidth) c.resize({ width: dom.clientWidth, height: dom.clientHeight });
        });
      };
      if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => resizeAll());
        charts.forEach((c) => ro.observe(c.getDom()));
      }
      window.addEventListener('resize', resizeAll);
      window.addEventListener('load', () => requestAnimationFrame(resizeAll));
      window.addEventListener('themechange', () => painters.forEach((p) => p()));
      // Catch late layout settling (fonts, images, grid, preloader removal).
      [50, 200, 500].forEach((t) => setTimeout(resizeAll, t));
    },

    todoList: function () {
      const todoForm = document.querySelector('[data-todo-form]');
      const todoList = document.querySelector('[data-todo-list]');

      todoForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        const input = todoForm.querySelector('[data-todo-input]');
        const value = input.value.trim();
        if (!value) return;

        const li = document.createElement('li');
        li.className = 'flex items-start gap-3';
        li.innerHTML = `
    <input type="checkbox" aria-label="Mark task as complete" class="mt-1 h-4 w-4 rounded border-surface-line text-brand-600 focus:ring-brand-600" />
    <span><span class="block font-semibold text-ink-900">${value}</span><span class="text-[13px] text-ink-400">Just now</span></span>`;
        todoList?.appendChild(li);
        input.value = '';
      });

      // Strike through completed tasks on check.
      todoList?.addEventListener('change', (event) => {
        if (event.target.matches('input[type="checkbox"]')) {
          const title = event.target.closest('li')?.querySelector('.font-semibold');
          title?.classList.toggle('line-through', event.target.checked);
          title?.classList.toggle('text-ink-400', event.target.checked);
        }
      });
    },

    modernSelects: function () {
      /* Upgrades every native <select> into a styled, searchable dropdown while keeping
         the original element in sync so form values and existing change listeners work. */
      const MS_CHEVRON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ms-chevron h-4 w-4 shrink-0 text-ink-400 transition-transform duration-200"><path d="m6 9 6 6 6-6"/></svg>`;
      const MS_SEARCH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;
      const MS_CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ms-check ml-auto h-4 w-4 shrink-0 text-brand-600"><path d="M20 6 9 17l-5-5"/></svg>`;

      function closeAllModernSelects(except) {
        document.querySelectorAll('[data-ms-panel]').forEach((panel) => {
          if (panel === except) return;
          panel.classList.add('hidden');
          panel.parentElement?.querySelector('.ms-chevron')?.classList.remove('rotate-180');
        });
      }

      function enhanceSelect(select) {
        if (select.dataset.msEnhanced || select.multiple || select.options.length === 0) return;
        select.dataset.msEnhanced = 'true';

        const options = [...select.options];
        const fullWidth = select.classList.contains('w-full');
        const searchable = options.length > 6;

        const wrapper = document.createElement('div');
        wrapper.className = 'modern-select relative ' + (fullWidth ? 'w-full' : 'inline-block');

        const button = document.createElement('button');
        button.type = 'button';
        button.className =
          'ms-button flex h-11 w-full min-w-[160px] items-center justify-between gap-2 rounded-base border border-surface-line bg-surface-card px-3 text-left text-[14px] text-ink-700 transition-colors hover:border-ink-300';
        button.innerHTML = '<span data-ms-label class="truncate"></span>' + MS_CHEVRON;

        const panel = document.createElement('div');
        panel.setAttribute('data-ms-panel', '');
        panel.className =
          'ms-panel absolute left-0 right-0 z-50 mt-1 hidden rounded-base border border-surface-line bg-surface-card p-1.5 shadow-lift';

        if (searchable) {
          const sb = document.createElement('div');
          sb.className = 'relative mb-1.5';
          sb.innerHTML =
            MS_SEARCH +
            '<input data-ms-search type="search" placeholder="Search" class="h-9 w-full rounded-base border border-surface-line bg-surface-muted/50 pl-9 pr-3 text-[13px] text-ink-700 placeholder:text-ink-400 focus:border-brand-600" />';
          panel.appendChild(sb);
        }

        const list = document.createElement('div');
        list.setAttribute('data-ms-list', '');
        list.className = 'dashboard-scrollbar max-h-60 overflow-y-auto';
        options.forEach((opt) => {
          const item = document.createElement('button');
          item.type = 'button';
          item.setAttribute('data-ms-option', '');
          item.dataset.value = opt.value;
          item.className =
            'flex w-full items-center gap-2 rounded-base px-3 py-2 text-left text-[14px] text-ink-700 transition-colors hover:bg-surface-muted';
          item.innerHTML = '<span class="truncate">' + opt.textContent + '</span>';
          list.appendChild(item);
        });
        panel.appendChild(list);

        const empty = document.createElement('p');
        empty.setAttribute('data-ms-empty', '');
        empty.className = 'hidden px-3 py-2 text-[13px] text-ink-400';
        empty.textContent = 'No results';
        panel.appendChild(empty);

        // Hide the native select but keep it for form value + accessibility.
        select.classList.add('sr-only');
        select.setAttribute('aria-hidden', 'true');
        select.tabIndex = -1;

        const parent = select.parentNode;
        parent.insertBefore(wrapper, select);
        wrapper.appendChild(select);
        wrapper.appendChild(button);
        wrapper.appendChild(panel);

        const labelEl = button.querySelector('[data-ms-label]');

        function syncSelected() {
          labelEl.textContent = select.options[select.selectedIndex]?.textContent ?? '';
          list.querySelectorAll('[data-ms-option]').forEach((item) => {
            const active = item.dataset.value === select.value;
            item.classList.toggle('bg-surface-muted', active);
            item.classList.toggle('font-semibold', active);
            item.classList.toggle('text-ink-900', active);
            const chk = item.querySelector('.ms-check');
            if (active && !chk) item.insertAdjacentHTML('beforeend', MS_CHECK);
            if (!active && chk) chk.remove();
          });
        }

        function filterList(query) {
          const q = query.toLowerCase();
          let any = false;
          list.querySelectorAll('[data-ms-option]').forEach((item) => {
            const match = item.textContent.toLowerCase().includes(q);
            item.classList.toggle('hidden', !match);
            if (match) any = true;
          });
          empty.classList.toggle('hidden', any);
        }

        function openPanel() {
          closeAllModernSelects(panel);
          panel.classList.remove('hidden');
          button.querySelector('.ms-chevron')?.classList.add('rotate-180');
          const search = panel.querySelector('[data-ms-search]');
          if (search) {
            search.value = '';
            filterList('');
            setTimeout(() => search.focus(), 0);
          }
        }

        function closePanel() {
          panel.classList.add('hidden');
          button.querySelector('.ms-chevron')?.classList.remove('rotate-180');
        }

        button.addEventListener('click', (event) => {
          event.stopPropagation();
          if (panel.classList.contains('hidden')) openPanel();
          else closePanel();
        });

        list.addEventListener('click', (event) => {
          const item = event.target.closest('[data-ms-option]');
          if (!item) return;
          select.value = item.dataset.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          syncSelected();
          closePanel();
        });

        const search = panel.querySelector('[data-ms-search]');
        search?.addEventListener('input', () => filterList(search.value));
        search?.addEventListener('click', (event) => event.stopPropagation());

        // Keep the custom UI in sync if the select is changed programmatically.
        select.addEventListener('change', syncSelected);

        syncSelected();
      }

      document.querySelectorAll('select').forEach(enhanceSelect);
      document.addEventListener('click', () => closeAllModernSelects());
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeAllModernSelects();
      });
    },

    preloaderInit: function () {
      const preloader = document.querySelector('[data-preloader]');
      if (!preloader) return;

      const hidePreloader = () => {
        preloader.classList.add('is-loaded');
        setTimeout(() => preloader.remove(), 400);
      };

      // CSS is inlined, so the page is fully styled the moment it parses — there's
      // no unstyled flash to mask. Reveal the content as soon as the DOM is ready
      // instead of waiting on the full load event (images, fonts), which keeps the
      // visible-content timing fast.
      if (document.readyState === 'interactive' || document.readyState === 'complete') {
        requestAnimationFrame(hidePreloader);
      } else {
        document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(hidePreloader));
      }
    },

    categorySlider: function () {
      const catScroll = document.querySelector('[data-cat-scroll]');
      if (catScroll) {
        const prevBtn = document.querySelector('[data-cat-prev]');
        const nextBtn = document.querySelector('[data-cat-next]');
        const step = () => Math.max(catScroll.clientWidth * 0.8, 200);

        function smoothScrollTo(target) {
          const max = catScroll.scrollWidth - catScroll.clientWidth;
          catScroll.scrollTo({ left: Math.max(0, Math.min(max, target)), behavior: 'smooth' });
        }

        const updateArrows = () => {
          const max = catScroll.scrollWidth - catScroll.clientWidth - 2;
          if (prevBtn) prevBtn.disabled = catScroll.scrollLeft <= 0;
          if (nextBtn) nextBtn.disabled = catScroll.scrollLeft >= max;
        };

        prevBtn?.addEventListener('click', () => smoothScrollTo(catScroll.scrollLeft - step()));
        nextBtn?.addEventListener('click', () => smoothScrollTo(catScroll.scrollLeft + step()));
        catScroll.addEventListener('scroll', updateArrows, { passive: true });
        window.addEventListener('resize', updateArrows);
        // Re-check once images have loaded (scrollWidth changes as they paint).
        window.addEventListener('load', updateArrows);
        updateArrows();
      }
    },

    /* Generic list-table controller used by every list page (products, brands,
       categories, orders, …). Wires up search, status filter, row selection +
       select-all, bulk delete, sortable columns and a "Columns" show/hide menu,
       all driven by data attributes so each page only supplies markup. */
    listTables: function () {
      const getModal = rbtJs.getModal;
      const openModal = rbtJs.openModal;
      window.__listRefreshers = window.__listRefreshers || [];
      document.querySelectorAll('[data-list-table]').forEach((root) => {
        rbtJs.initListTable(root, getModal, openModal);
      });
    },

    initListTable: function (root, getModal, openModal) {
      const table = root.querySelector('table');
      const tbody = root.querySelector('tbody');
      if (!table || !tbody) return;

      const noun = root.dataset.listNoun || 'items';
      const searchInput = root.querySelector('[data-list-search]');
      // Any number of status/type/etc. filters; each maps to a row data-* key.
      const filterSelects = [...root.querySelectorAll('[data-list-filter]')];
      const selectAll = root.querySelector('[data-select-all]');
      const bulkBtn = root.querySelector('[data-bulk-delete]');
      const bulkCount = root.querySelector('[data-bulk-count]');
      const pageInfo = root.querySelector('[data-list-info]');
      const emptyMsg = root.querySelector('[data-list-empty]');

      const rows = () => [...tbody.querySelectorAll(':scope > tr')];
      const visibleRows = () => rows().filter((r) => !r.classList.contains('hidden'));
      const selected = () => rows().filter((r) => r.querySelector('[data-row-select]')?.checked);

      function updateBulk() {
        const n = selected().length;
        if (bulkCount) bulkCount.textContent = String(n);
        if (bulkBtn) bulkBtn.disabled = n === 0;
        const vis = visibleRows();
        const visChecked = vis.filter((r) => r.querySelector('[data-row-select]')?.checked);
        if (selectAll) {
          selectAll.checked = vis.length > 0 && visChecked.length === vis.length;
          selectAll.indeterminate = visChecked.length > 0 && visChecked.length < vis.length;
        }
      }

      function applyFilter() {
        const q = (searchInput?.value || '').trim().toLowerCase();
        const activeFilters = filterSelects
          .map((sel) => ({ key: sel.dataset.filterKey || 'status', value: (sel.value || 'all').toLowerCase() }))
          .filter((f) => f.value !== 'all');
        rows().forEach((row) => {
          const haystack = `${row.dataset.name || ''} ${row.textContent || ''}`.toLowerCase();
          const matchQ = !q || haystack.includes(q);
          const matchF = activeFilters.every((f) => (row.dataset[f.key] || '').toLowerCase() === f.value);
          const show = matchQ && matchF;
          row.classList.toggle('hidden', !show);
          if (!show) {
            const c = row.querySelector('[data-row-select]');
            if (c) c.checked = false;
          }
        });
        const count = visibleRows().length;
        if (emptyMsg) emptyMsg.classList.toggle('hidden', count > 0);
        if (pageInfo) pageInfo.textContent = `Showing ${count} of ${rows().length} ${noun}`;
        updateBulk();
      }

      searchInput?.addEventListener('input', applyFilter);
      filterSelects.forEach((sel) => sel.addEventListener('change', applyFilter));

      selectAll?.addEventListener('change', () => {
        visibleRows().forEach((r) => {
          const c = r.querySelector('[data-row-select]');
          if (c) c.checked = selectAll.checked;
        });
        updateBulk();
      });
      tbody.addEventListener('change', (event) => {
        if (event.target.matches('[data-row-select]')) updateBulk();
      });

      bulkBtn?.addEventListener('click', () => {
        const sel = selected();
        if (!sel.length) return;
        const modal = getModal('confirm-delete');
        if (!modal) return;
        const msg = modal.querySelector('[data-modal-message]');
        const single = noun.replace(/s$/, '');
        if (msg)
          msg.textContent = `Delete ${sel.length} selected ${sel.length > 1 ? noun : single}? This action cannot be undone.`;
        openModal(modal);
        modal.bulkRows = sel;
      });

      // Sortable columns. Numeric columns are flagged with data-sort-type="num".
      root.querySelectorAll('[data-sort]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const key = btn.dataset.sort;
          const numeric = btn.dataset.sortType === 'num';
          const dir = btn.dataset.dir === 'asc' ? 'desc' : 'asc';
          root.querySelectorAll('[data-sort]').forEach((o) => {
            if (o !== btn) delete o.dataset.dir;
          });
          btn.dataset.dir = dir;
          rows()
            .sort((a, b) => {
              const va = a.dataset[key];
              const vb = b.dataset[key];
              if (numeric) {
                return dir === 'asc' ? parseFloat(va) - parseFloat(vb) : parseFloat(vb) - parseFloat(va);
              }
              return dir === 'asc'
                ? String(va || '').localeCompare(vb || '')
                : String(vb || '').localeCompare(va || '');
            })
            .forEach((r) => tbody.appendChild(r));
        });
      });

      // Column show/hide menu. Each menu item carries data-col-item="<1-based index>"
      // and we toggle every header/body cell in that column via :nth-child.
      const setColumn = (idx, show) => {
        table.querySelectorAll(`thead th:nth-child(${idx})`).forEach((cell) => cell.classList.toggle('hidden', !show));
        tbody.querySelectorAll(`:scope > tr`).forEach((tr) => {
          const cell = tr.querySelector(`:scope > :nth-child(${idx})`);
          if (cell) cell.classList.toggle('hidden', !show);
        });
      };
      root.querySelectorAll('[data-col-item]').forEach((item) => {
        item.addEventListener('change', () => setColumn(Number(item.dataset.colItem), item.checked));
      });

      window.__listRefreshers.push(applyFilter);
      applyFilter();
    },
  };

  // Expose so page-level scripts can reuse helpers (renderLucideIcons, modals, …).
  window.rbtJs = rbtJs;

  // Module scripts are deferred, but guard anyway so init runs once the DOM is ready.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', rbtJs.i);
  } else {
    rbtJs.i();
  }
})(window, document);
