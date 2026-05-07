import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  Download,
  Factory,
  Filter,
  Github,
  HelpCircle,
  Layers3,
  LockKeyhole,
  LogOut,
  Mail,
  Map,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import { matrix } from './data/matrix.generated.js';
import { materials as initialMaterials } from './data/materials.js';
import { cases } from './data/cases.js';
import './styles.css';

const base = import.meta.env.BASE_URL;
const sessionKey = 'axoft-portal-user';
const buildMarker = 'rollback-clean-2026-05-06';
const githubConfig = {
  owner: 'asryazanov',
  repo: 'axoft-partner-portal',
  branch: 'main',
  materialsPath: 'src/data/materials.js',
  assetsPath: 'public/assets/materials',
};

const demoUsers = [
  {
    id: 'partner',
    name: 'Партнер Axoft',
    email: 'partner@demo.ru',
    password: 'partner',
    role: 'Партнер',
    company: 'Демо-партнер',
  },
  {
    id: 'am',
    name: 'Axoft AM',
    email: 'am@axoft.ru',
    password: 'axoft',
    role: 'Axoft AM',
    company: 'Axoft',
  },
  {
    id: 'admin',
    name: 'Администратор',
    email: 'admin@axoft.ru',
    password: 'admin',
    role: 'Администратор',
    company: 'Axoft',
    isAdmin: true,
  },
];

const baseNav = [
  { id: 'matrix', label: 'Матрица решений', icon: BarChart3 },
  { id: 'map', label: 'Карта направлений', icon: Map },
  { id: 'library', label: 'Материалы', icon: BookOpen },
  { id: 'cases', label: 'Кейсы', icon: BriefcaseBusiness },
  { id: 'overview', label: 'Обзор', icon: Layers3 },
];
const adminNav = { id: 'admin', label: 'Админка', icon: Github };

const levelLabels = {
  strategic: 'Стратегический уровень',
  operational: 'Операционный уровень',
  technical: 'Технический уровень',
};

const levelByBlock = {
  'Стратегическое управление': 'strategic',
  'Финансовое управление': 'strategic',
  'Цифровизация': 'strategic',
  'Производство (MES)': 'operational',
  'Управление качеством': 'operational',
  'Техническая эксплуатация': 'operational',
  'Управление персоналом': 'operational',
  'Логистика и склад': 'operational',
  'Закупки': 'operational',
  'Продажи': 'operational',
  'Управление проектами': 'operational',
};

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function roleInitials(role) {
  return role
    .split(/[\s/()]+/)
    .map((word) => word[0])
    .filter((letter) => /[A-Za-zА-Яа-яЁё]/.test(letter))
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function assetHref(path) {
  return `${base}${path.replace(/^\//, '')}`;
}

function emptyMaterial() {
  return {
    id: '',
    title: '',
    description: '',
    format: 'PDF',
    version: '',
    category: '',
    tagsText: '',
    href: '',
  };
}

function normalizeMaterial(form) {
  return {
    id: form.id.trim(),
    title: form.title.trim(),
    description: form.description.trim(),
    format: form.format.trim().toUpperCase(),
    version: form.version.trim(),
    category: form.category.trim(),
    tags: form.tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    href: form.href.trim(),
  };
}

function materialToForm(material) {
  return {
    ...material,
    tagsText: material.tags.join(', '),
  };
}

function materialModuleSource(items) {
  return `export const materials = ${JSON.stringify(items, null, 2)};\n`;
}

function encodeBase64(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function slugifyFileName(name) {
  const dot = name.lastIndexOf('.');
  const extension = dot >= 0 ? name.slice(dot).toLowerCase() : '';
  const baseName = (dot >= 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${baseName || 'material'}${extension}`;
}

async function githubRequest(path, token, options = {}) {
  const response = await fetch(`https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(details.message || `GitHub API: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function getGithubSha(path, token) {
  try {
    const file = await githubRequest(`${path}?ref=${githubConfig.branch}`, token);
    return file.sha;
  } catch (error) {
    if (String(error.message).includes('Not Found')) return '';
    throw error;
  }
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = window.localStorage.getItem(sessionKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [page, setPage] = useState('matrix');
  const [query, setQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [materialCategory, setMaterialCategory] = useState('Все');
  const [caseDirection, setCaseDirection] = useState('Все');
  const [materialStore, setMaterialStore] = useState(initialMaterials);

  const blocks = useMemo(() => unique(matrix.map((item) => item.block)), []);
  const roles = useMemo(() => unique(matrix.map((item) => item.role)), []);
  const materialCategories = useMemo(() => ['Все', ...unique(materialStore.map((item) => item.category))], [materialStore]);
  const caseDirections = useMemo(() => ['Все', ...unique(cases.map((item) => item.direction))], []);
  const nav = currentUser?.isAdmin ? [...baseNav, adminNav] : baseNav;

  const mapCards = useMemo(
    () =>
      blocks.map((block) => {
        const rows = matrix.filter((item) => item.block === block);
        const level = levelByBlock[block] || 'technical';
        return {
          block,
          level,
          roles: rows.length,
          solutions: unique(rows.flatMap((item) => item.solutions)).slice(0, 4),
        };
      }),
    [blocks],
  );

  const filteredMatrix = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return matrix.filter((item) => {
      if (selectedLevel && (levelByBlock[item.block] || 'technical') !== selectedLevel) return false;
      if (selectedBlock && item.block !== selectedBlock) return false;
      if (selectedRole && item.role !== selectedRole) return false;
      if (!needle) return true;
      const haystack = [item.role, item.block, ...item.pains, ...item.solutions, ...item.results].join(' ').toLowerCase();
      return haystack.includes(needle);
    });
  }, [query, selectedLevel, selectedBlock, selectedRole]);

  const filteredMaterials = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return materialStore.filter((item) => {
      if (materialCategory !== 'Все' && item.category !== materialCategory) return false;
      if (!needle) return true;
      const haystack = [item.title, item.description, item.category, ...item.tags].join(' ').toLowerCase();
      return haystack.includes(needle);
    });
  }, [query, materialCategory, materialStore]);

  const filteredCases = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return cases.filter((item) => {
      if (caseDirection !== 'Все' && item.direction !== caseDirection) return false;
      if (!needle) return true;
      const haystack = [item.title, item.company, item.region, item.direction, item.industry, ...item.tags].join(' ').toLowerCase();
      return haystack.includes(needle);
    });
  }, [query, caseDirection]);

  function openMatrix(block = '') {
    setSelectedLevel('');
    setSelectedBlock(block);
    setSelectedRole('');
    setPage('matrix');
  }

  function openMatrixByLevel(level = '') {
    setSelectedLevel(level);
    setSelectedBlock('');
    setSelectedRole('');
    setPage('matrix');
  }

  function handleGlobalSearch(value) {
    setQuery(value);
    if (value.trim()) {
      setPage('matrix');
    }
  }

  function handleLogin(email, password) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = demoUsers.find((item) => item.email.toLowerCase() === normalizedEmail && item.password === password);

    if (!user) {
      return 'Проверьте логин и пароль. Для демо используйте partner@demo.ru / partner, am@axoft.ru / axoft или admin@axoft.ru / admin.';
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      isAdmin: Boolean(user.isAdmin),
    };
    window.localStorage.setItem(sessionKey, JSON.stringify(sessionUser));
    setCurrentUser(sessionUser);
    return '';
  }

  function handleLogout() {
    window.localStorage.removeItem(sessionKey);
    setCurrentUser(null);
    setPage('matrix');
    setQuery('');
  }

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <>
      <header className="app-header" data-build={buildMarker}>
        <div className="topbar">
          <button className="brand" onClick={() => setPage('matrix')} aria-label="Открыть матрицу">
            <img src={assetHref('/assets/brand/axoft-logo.png')} alt="Axoft" />
          </button>
          <div className="portal-title">
            <span>Партнерский портал</span>
            <strong>Подбор решений для промышленных клиентов</strong>
          </div>
          <label className="global-search">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => handleGlobalSearch(event.target.value)}
              placeholder="Поиск по ролям, задачам, решениям и материалам"
            />
          </label>
          <a className="support-button" href="mailto:partners@axoft.ru" title="Запросить помощь" aria-label="Запросить помощь">
            <HelpCircle size={18} />
          </a>
          <div className="user-menu" aria-label="Профиль пользователя">
            <span className="user-avatar">{roleInitials(currentUser.name)}</span>
            <div>
              <strong>{currentUser.name}</strong>
              <span>{currentUser.role}</span>
            </div>
            <button onClick={handleLogout} title="Выйти" aria-label="Выйти">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-title">Разделы</div>
          <nav className="side-nav" aria-label="Разделы портала">
            {nav.map(({ id, label, icon: Icon }) => (
              <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}>
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <a className="sidebar-help" href="mailto:partners@axoft.ru">
            <Mail size={17} />
            partners@axoft.ru
          </a>
        </aside>

        <main>
          {page === 'overview' && (
            <Overview
              user={currentUser}
              matrixCount={matrix.length}
              blockCount={blocks.length}
              materialCount={materialStore.length}
              caseCount={cases.length}
              onOpenMap={() => setPage('map')}
              onOpenMatrix={() => openMatrix()}
              onOpenLibrary={() => setPage('library')}
            />
          )}
          {page === 'map' && <DirectionMap cards={mapCards} onOpenMatrix={openMatrix} onOpenLevel={openMatrixByLevel} />}
          {page === 'matrix' && (
            <MatrixView
              blocks={blocks}
              roles={roles}
              rows={filteredMatrix}
              selectedLevel={selectedLevel}
              selectedBlock={selectedBlock}
              selectedRole={selectedRole}
              setSelectedLevel={setSelectedLevel}
              setSelectedBlock={setSelectedBlock}
              setSelectedRole={setSelectedRole}
              total={matrix.length}
            />
          )}
          {page === 'library' && (
            <LibraryView
              categories={materialCategories}
              activeCategory={materialCategory}
              setActiveCategory={setMaterialCategory}
              materials={filteredMaterials}
            />
          )}
          {page === 'admin' && currentUser.isAdmin && <AdminMaterials initialItems={materialStore} onLocalUpdate={setMaterialStore} />}
          {page === 'cases' && (
            <CasesView
              directions={caseDirections}
              activeDirection={caseDirection}
              setActiveDirection={setCaseDirection}
              cases={filteredCases}
            />
          )}
        </main>
      </div>
    </>
  );
}

function AuthScreen({ onLogin }) {
  const [email, setEmail] = useState('partner@demo.ru');
  const [password, setPassword] = useState('partner');
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    setError(onLogin(email, password));
  }

  function fillDemo(user) {
    setEmail(user.email);
    setPassword(user.password);
    setError('');
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <div className="auth-brand">
          <img src={assetHref('/assets/brand/axoft-logo.png')} alt="Axoft" />
          <span>
            <LockKeyhole size={17} />
            Закрытый прототип портала
          </span>
          <h1>Войдите в партнёрский портал Axoft</h1>
          <p>Демо-авторизация защищает интерфейс и показывает разные контексты для партнера и Axoft AM.</p>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <h2>Авторизация</h2>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" />
          </label>
          <label>
            Пароль
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button className="primary-action" type="submit">
            Войти <ArrowRight size={18} />
          </button>
          <div className="demo-logins">
            {demoUsers.map((user) => (
              <button type="button" key={user.id} onClick={() => fillDemo(user)}>
                <UserRound size={16} />
                {user.role}
              </button>
            ))}
          </div>
        </form>
      </section>
    </main>
  );
}

function Overview({ user, matrixCount, blockCount, materialCount, caseCount, onOpenMap, onOpenMatrix, onOpenLibrary }) {
  return (
    <section className="overview">
      <div className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={16} />
            {user.role}: {user.company}
          </span>
          <h1>Быстро подбирайте решения Axoft по роли, задаче и бизнес-результату клиента</h1>
          <p>
            Портал превращает матрицу промышленного направления в рабочий инструмент: карта ролей, готовые
            материалы, кейсы и аргументы для разговора с клиентом.
          </p>
          <div className="hero-actions">
            <button className="primary-action" onClick={onOpenMap}>
              Открыть карту <ArrowRight size={18} />
            </button>
            <button className="secondary-action" onClick={onOpenMatrix}>
              Матрица решений
            </button>
            <button className="secondary-action" onClick={onOpenLibrary}>
              Скачать материалы
            </button>
          </div>
        </div>
        <div className="hero-panel" aria-label="Статистика портала">
          {[
            ['Направлений', blockCount],
            ['Клиентских ролей', matrixCount],
            ['Материалов', materialCount],
            ['Кейсов', caseCount],
          ].map(([label, value]) => (
            <div className="metric" key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="workflow">
        {[
          ['Найдите роль', 'Поиск и фильтры помогают начать с должности, направления или боли клиента.', Target],
          ['Подберите решение', 'Видны продукты, платформы и технологические связки Axoft под задачу.', Layers3],
          ['Подкрепите материалом', 'Карточки ведут на реальные файлы: PDF, PPTX, DOCX и XLSX.', Download],
          ['Говорите результатами', 'В каждой строке есть бизнес-эффект, который удобно вынести в диалог.', CheckCircle2],
        ].map(([title, text, Icon]) => (
          <article className="workflow-card" key={title}>
            <Icon size={22} />
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function DirectionMap({ cards, onOpenMatrix, onOpenLevel }) {
  return (
    <section className="page-shell">
      <PageTitle
        icon={Map}
        title="Карта направлений"
        text="Выберите направление, чтобы сразу отфильтровать роли, задачи и решения в матрице."
      />
      <div className="legend">
        {Object.entries(levelLabels).map(([level, label]) => (
          <button className={`legend-pill ${level}`} key={level} onClick={() => onOpenLevel(level)}>
            {label}
          </button>
        ))}
      </div>
      <div className="map-grid">
        {cards.map((card) => (
          <button className={`direction-card ${card.level}`} key={card.block} onClick={() => onOpenMatrix(card.block)}>
            <span>{levelLabels[card.level]}</span>
            <h3>{card.block}</h3>
            <p>{card.roles} роли в матрице</p>
            <div>
              {card.solutions.map((solution) => (
                <small key={solution}>{solution}</small>
              ))}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function MatrixView({
  blocks,
  roles,
  rows,
  selectedLevel,
  selectedBlock,
  selectedRole,
  setSelectedLevel,
  setSelectedBlock,
  setSelectedRole,
  total,
}) {
  const [activeKey, setActiveKey] = useState('');
  const activeRow = rows.find((row) => `${row.block}-${row.role}` === activeKey) || rows[0];
  const hasFilters = Boolean(selectedLevel || selectedBlock || selectedRole);
  const activeFilters = [
    selectedLevel && { key: 'level', label: 'Уровень', value: levelLabels[selectedLevel] || selectedLevel, onClear: () => clearSingleFilter('level') },
    selectedBlock && { key: 'block', label: 'Направление', value: selectedBlock, onClear: () => clearSingleFilter('block') },
    selectedRole && { key: 'role', label: 'Роль клиента', value: selectedRole, onClear: () => clearSingleFilter('role') },
  ].filter(Boolean);

  function chooseLevel(level) {
    setSelectedLevel(level);
    setSelectedBlock('');
    setSelectedRole('');
    setActiveKey('');
  }

  function chooseBlock(block) {
    setSelectedBlock(block);
    setSelectedLevel('');
    setSelectedRole('');
    setActiveKey('');
  }

  function chooseRole(role) {
    setSelectedRole(role);
    setActiveKey('');
  }

  function clearFilters() {
    setSelectedLevel('');
    setSelectedBlock('');
    setSelectedRole('');
    setActiveKey('');
  }

  function clearSingleFilter(filter) {
    if (filter === 'level') setSelectedLevel('');
    if (filter === 'block') setSelectedBlock('');
    if (filter === 'role') setSelectedRole('');
    setActiveKey('');
  }

  return (
    <section className="page-shell">
      <PageTitle
        icon={BarChart3}
        title="Матрица решений"
        text={`Показано ${rows.length} из ${total} строк. Фильтруйте по направлению или роли клиента.`}
      />
      <div className="filters">
        <Select label="Уровень" value={selectedLevel} onChange={chooseLevel} options={['', ...Object.keys(levelLabels)]} optionLabels={levelLabels} />
        <Select label="Направление" value={selectedBlock} onChange={chooseBlock} options={['', ...blocks]} />
        <Select label="Роль клиента" value={selectedRole} onChange={chooseRole} options={['', ...roles]} />
        <button className="clear-button" onClick={clearFilters} disabled={!hasFilters}>
          <RotateCcw size={17} />
          Сбросить фильтры
        </button>
      </div>
      {hasFilters && (
        <div className="active-filters" aria-label="Активные фильтры">
          {activeFilters.map((filter) => (
            <button key={filter.key} onClick={filter.onClear} title={`Снять фильтр: ${filter.value}`}>
              <span>{filter.label}: {filter.value}</span>
              <X size={14} />
            </button>
          ))}
        </div>
      )}
      <div className="matrix-workspace">
        <div className="role-list" aria-label="Роли клиентов">
          {!!rows.length && (
            <div className="role-list-title">
              <strong>Роли клиентов</strong>
              <span>Выберите роль для просмотра деталей</span>
            </div>
          )}
          {rows.map((row) => {
            const key = `${row.block}-${row.role}`;
            const active = activeRow && key === `${activeRow.block}-${activeRow.role}`;
            return (
              <button className={active ? 'active' : ''} key={key} onClick={() => setActiveKey(key)}>
                <span className="role-avatar small">{roleInitials(row.role)}</span>
                <span>
                  <strong>{row.role}</strong>
                  <small>{row.block}</small>
                  <RolePreviewTags solutions={row.solutions} />
                </span>
                <ChevronRight size={16} />
              </button>
            );
          })}
          {!rows.length && <div className="empty-state">Ничего не найдено. Попробуйте изменить фильтры или поиск.</div>}
        </div>
        {activeRow && (
          <article className="matrix-detail">
            <div className="matrix-head">
              <span className="role-avatar">{roleInitials(activeRow.role)}</span>
              <div>
                <span className="block-label">{activeRow.block}</span>
                <h3>{activeRow.role}</h3>
              </div>
            </div>
            <div className="matrix-summary">
              <span>{activeRow.pains.length} задачи</span>
              <span>{activeRow.solutions.length} решений</span>
              <span>{activeRow.results.length} результата</span>
            </div>
            <div className="detail-grid">
              <Column title="Что беспокоит" items={activeRow.pains} />
              <div className="detail-section solution-section">
                <h4>Решение Axoft</h4>
                <SolutionTags key={`${activeRow.block}-${activeRow.role}`} solutions={activeRow.solutions} />
              </div>
              <Column title="Бизнес-результат" items={activeRow.results} positive />
            </div>
          </article>
        )}
      </div>
    </section>
  );
}

function AdminMaterials({ initialItems, onLocalUpdate }) {
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState(() => emptyMaterial());
  const [selectedId, setSelectedId] = useState('');
  const [token, setToken] = useState('');
  const [file, setFile] = useState(null);
  const [deletedHrefs, setDeletedHrefs] = useState([]);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(selectedId);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function selectMaterial(material) {
    setSelectedId(material.id);
    setForm(materialToForm(material));
    setFile(null);
    setStatus({ type: '', text: '' });
  }

  function createMaterial() {
    setSelectedId('');
    setForm(emptyMaterial());
    setFile(null);
    setStatus({ type: '', text: '' });
  }

  function validate(material) {
    if (!material.id) return 'Заполните ID материала.';
    if (!material.title) return 'Заполните название.';
    if (!material.description) return 'Заполните описание.';
    if (!material.category) return 'Заполните категорию.';
    if (!material.version) return 'Заполните версию.';
    if (!material.href && !file) return 'Добавьте файл или укажите ссылку на файл.';
    return '';
  }

  function upsertLocal(event) {
    event.preventDefault();
    const material = normalizeMaterial(form);
    const error = validate(material);

    if (error) {
      setStatus({ type: 'error', text: error });
      return null;
    }

    const next = items.some((item) => item.id === selectedId || item.id === material.id)
      ? items.map((item) => (item.id === selectedId || item.id === material.id ? material : item))
      : [...items, material];

    setItems(next);
    onLocalUpdate(next);
    setSelectedId(material.id);
    setStatus({ type: 'success', text: 'Материал обновлён в текущем списке. Для публикации сохраните изменения в GitHub.' });
    return { material, next };
  }

  function removeMaterial(material) {
    const next = items.filter((item) => item.id !== material.id);
    setItems(next);
    onLocalUpdate(next);
    setDeletedHrefs((current) => (material.href.startsWith('/assets/materials/') ? [...current, material.href] : current));
    if (selectedId === material.id) createMaterial();
    setStatus({ type: 'success', text: 'Материал удалён из текущего списка. Для публикации сохраните изменения в GitHub.' });
  }

  async function putGithubFile(path, content, message, sha = '') {
    return githubRequest(path, token.trim(), {
      method: 'PUT',
      body: JSON.stringify({
        message,
        content,
        branch: githubConfig.branch,
        ...(sha ? { sha } : {}),
      }),
    });
  }

  async function deleteGithubFile(path, message) {
    const sha = await getGithubSha(path, token.trim());
    if (!sha) return;
    await githubRequest(path, token.trim(), {
      method: 'DELETE',
      body: JSON.stringify({
        message,
        sha,
        branch: githubConfig.branch,
      }),
    });
  }

  async function publishToGithub() {
    if (!token.trim()) {
      setStatus({ type: 'error', text: 'Вставьте GitHub token с правом Contents: read/write.' });
      return;
    }

    setSaving(true);
    setStatus({ type: '', text: '' });

    try {
      let nextItems = items;
      let material = normalizeMaterial(form);
      const error = validate(material);

      if (!error) {
        if (file) {
          const fileName = slugifyFileName(file.name);
          const assetPath = `${githubConfig.assetsPath}/${fileName}`;
          const assetSha = await getGithubSha(assetPath, token.trim());
          await putGithubFile(assetPath, await fileToBase64(file), `Upload material ${fileName}`, assetSha);
          material = { ...material, href: `/assets/materials/${fileName}`, format: fileName.split('.').pop().toUpperCase() };
          setForm(materialToForm(material));
        }

        nextItems = items.some((item) => item.id === selectedId || item.id === material.id)
          ? items.map((item) => (item.id === selectedId || item.id === material.id ? material : item))
          : [...items, material];
      }

      for (const href of deletedHrefs) {
        await deleteGithubFile(`public${href}`, `Delete material asset ${href.split('/').pop()}`);
      }

      const materialsSha = await getGithubSha(githubConfig.materialsPath, token.trim());
      await putGithubFile(
        githubConfig.materialsPath,
        encodeBase64(materialModuleSource(nextItems)),
        'Update portal materials',
        materialsSha,
      );

      setItems(nextItems);
      onLocalUpdate(nextItems);
      setDeletedHrefs([]);
      setFile(null);
      setStatus({ type: 'success', text: 'Изменения сохранены в GitHub. GitHub Pages обновится после завершения workflow.' });
    } catch (error) {
      setStatus({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page-shell">
      <PageTitle icon={Github} title="Админка материалов" text="Управляйте карточками материалов и публикуйте изменения в GitHub." />
      <div className="admin-grid">
        <div className="admin-list">
          <div className="admin-toolbar">
            <strong>Материалы</strong>
            <button onClick={createMaterial}>
              <Plus size={16} />
              Добавить
            </button>
          </div>
          {items.map((item) => (
            <button key={item.id} className={selectedId === item.id ? 'active' : ''} onClick={() => selectMaterial(item)}>
              <span>
                <strong>{item.title}</strong>
                <small>{item.category} · {item.format} · {item.version}</small>
              </span>
              <Pencil size={15} />
            </button>
          ))}
        </div>

        <form className="admin-editor" onSubmit={upsertLocal}>
          <div className="admin-editor-head">
            <div>
              <span>{isEditing ? 'Редактирование' : 'Новый материал'}</span>
              <h3>{form.title || 'Карточка материала'}</h3>
            </div>
            {isEditing && (
              <button type="button" className="danger-button" onClick={() => removeMaterial(items.find((item) => item.id === selectedId) || normalizeMaterial(form))}>
                <Trash2 size={16} />
                Удалить
              </button>
            )}
          </div>

          <div className="admin-form-grid">
            <label>
              ID
              <input value={form.id} onChange={(event) => updateField('id', event.target.value)} placeholder="material-id" />
            </label>
            <label>
              Формат
              <select value={form.format} onChange={(event) => updateField('format', event.target.value)}>
                {['PDF', 'PPTX', 'DOCX', 'XLSX', 'ZIP', 'LINK'].map((format) => (
                  <option key={format} value={format}>{format}</option>
                ))}
              </select>
            </label>
            <label>
              Название
              <input value={form.title} onChange={(event) => updateField('title', event.target.value)} />
            </label>
            <label>
              Версия
              <input value={form.version} onChange={(event) => updateField('version', event.target.value)} />
            </label>
            <label>
              Категория
              <input value={form.category} onChange={(event) => updateField('category', event.target.value)} />
            </label>
            <label>
              Теги через запятую
              <input value={form.tagsText} onChange={(event) => updateField('tagsText', event.target.value)} />
            </label>
            <label className="wide-field">
              Описание
              <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} rows={4} />
            </label>
            <label className="wide-field">
              Ссылка на файл
              <input value={form.href} onChange={(event) => updateField('href', event.target.value)} placeholder="/assets/materials/file.pdf" />
            </label>
            <label className="wide-field file-field">
              <Upload size={18} />
              <span>{file ? file.name : 'Загрузить новый файл материала'}</span>
              <input
                type="file"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] || null;
                  setFile(nextFile);
                  if (nextFile) {
                    updateField('href', `/assets/materials/${slugifyFileName(nextFile.name)}`);
                    updateField('format', nextFile.name.split('.').pop().toUpperCase());
                  }
                }}
              />
            </label>
          </div>

          <div className="github-box">
            <label>
              GitHub token
              <input value={token} onChange={(event) => setToken(event.target.value)} type="password" placeholder="Fine-grained token: Contents read/write" />
            </label>
            <div className="admin-actions">
              <button type="submit" className="secondary-admin-button">
                <Save size={16} />
                Сохранить в список
              </button>
              <button type="button" className="primary-admin-button" onClick={publishToGithub} disabled={saving}>
                <Github size={16} />
                {saving ? 'Публикация...' : 'Сохранить в GitHub'}
              </button>
            </div>
          </div>

          {status.text && <p className={`admin-status ${status.type}`}>{status.text}</p>}
        </form>
      </div>
    </section>
  );
}

function LibraryView({ categories, activeCategory, setActiveCategory, materials: visibleMaterials }) {
  return (
    <section className="page-shell">
      <PageTitle icon={BookOpen} title="Библиотека материалов" text="Файлы опубликованы вместе с сайтом и доступны для скачивания." />
      <div className="category-row">
        {categories.map((category) => (
          <button key={category} className={activeCategory === category ? 'active' : ''} onClick={() => setActiveCategory(category)}>
            {category}
          </button>
        ))}
      </div>
      <div className="materials-grid">
        {visibleMaterials.map((item) => (
          <article className="material-card" key={item.id}>
            <div className={`format-badge ${item.format.toLowerCase()}`}>{item.format}</div>
            <span className="version">{item.version}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <div className="tags">
              {item.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <a className="download-link" href={assetHref(item.href)} download>
              <Download size={17} />
              Скачать
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

function CasesView({ directions, activeDirection, setActiveDirection, cases: visibleCases }) {
  return (
    <section className="page-shell">
      <PageTitle icon={BriefcaseBusiness} title="Истории успеха" text="Кейсы помогают быстро подобрать похожий сценарий и аргументы для клиента." />
      <div className="category-row">
        {directions.map((direction) => (
          <button key={direction} className={activeDirection === direction ? 'active' : ''} onClick={() => setActiveDirection(direction)}>
            {direction}
          </button>
        ))}
      </div>
      <div className="cases-list">
        {visibleCases.map((item) => (
          <article className="case-card" key={item.id}>
            <div className="case-icon">
              {item.tags.includes('ИБ') ? <ShieldCheck size={24} /> : item.tags.includes('WMS') ? <Building2 size={24} /> : <Factory size={24} />}
            </div>
            <div>
              <div className="tags">
                {item.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <h3>{item.title}</h3>
              <p>{item.result}</p>
              <div className="case-meta">
                <span>{item.company}</span>
                <span>{item.region}</span>
                <span>{item.scale}</span>
                <span>{item.period}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PageTitle({ icon: Icon, title, text }) {
  return (
    <div className="page-title">
      <div className="title-icon">
        <Icon size={22} />
      </div>
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options, optionLabels = {} }) {
  return (
    <label className="select-wrap">
      <span>
        <Filter size={15} />
        {label}
      </span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option || 'all'} value={option}>
            {option ? optionLabels[option] || option : 'Все'}
          </option>
        ))}
      </select>
    </label>
  );
}

function RolePreviewTags({ solutions }) {
  const visible = solutions.slice(0, 3);
  const hiddenCount = Math.max(solutions.length - visible.length, 0);

  return (
    <span className="role-preview-tags" aria-label="Краткий список решений">
      {visible.map((solution) => (
        <span key={solution}>{solution}</span>
      ))}
      {hiddenCount > 0 && <span>+{hiddenCount}</span>}
    </span>
  );
}

function SolutionTags({ solutions }) {
  const [expanded, setExpanded] = useState(false);
  const shouldCollapse = solutions.length > 5;
  const visibleSolutions = shouldCollapse && !expanded ? solutions.slice(0, 5) : solutions;
  const hiddenCount = solutions.length - visibleSolutions.length;

  return (
    <>
      <div className="solution-tags">
        {visibleSolutions.map((solution) => (
          <span key={solution}>{solution}</span>
        ))}
      </div>
      {shouldCollapse && (
        <button className="show-more-button" onClick={() => setExpanded((value) => !value)}>
          {expanded ? 'Скрыть' : `Показать все +${hiddenCount}`}
        </button>
      )}
    </>
  );
}

function Column({ title, items, positive = false }) {
  return (
    <div className={`detail-section ${positive ? 'result-section' : ''}`}>
      <h4>{title}</h4>
      <ul className={positive ? 'positive-list' : 'plain-list'}>
        {items.filter(Boolean).map((item) => (
          <li key={item}>
            {positive && <CheckCircle2 size={15} />}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
