import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Download,
  Factory,
  FileText,
  Filter,
  HelpCircle,
  Layers3,
  Map,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
} from 'lucide-react';
import { matrix } from './data/matrix.generated.js';
import { materials } from './data/materials.js';
import { cases } from './data/cases.js';
import './styles.css';

const base = import.meta.env.BASE_URL;

const nav = [
  { id: 'overview', label: 'Обзор', icon: Layers3 },
  { id: 'map', label: 'Карта направлений', icon: Map },
  { id: 'matrix', label: 'Матрица решений', icon: BarChart3 },
  { id: 'library', label: 'Материалы', icon: BookOpen },
  { id: 'cases', label: 'Кейсы', icon: BriefcaseBusiness },
];

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

function App() {
  const [page, setPage] = useState('overview');
  const [query, setQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [materialCategory, setMaterialCategory] = useState('Все');
  const [caseDirection, setCaseDirection] = useState('Все');

  const blocks = useMemo(() => unique(matrix.map((item) => item.block)), []);
  const roles = useMemo(() => unique(matrix.map((item) => item.role)), []);
  const materialCategories = useMemo(() => ['Все', ...unique(materials.map((item) => item.category))], []);
  const caseDirections = useMemo(() => ['Все', ...unique(cases.map((item) => item.direction))], []);

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
      if (selectedBlock && item.block !== selectedBlock) return false;
      if (selectedRole && item.role !== selectedRole) return false;
      if (!needle) return true;
      const haystack = [item.role, item.block, ...item.pains, ...item.solutions, ...item.results].join(' ').toLowerCase();
      return haystack.includes(needle);
    });
  }, [query, selectedBlock, selectedRole]);

  const filteredMaterials = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return materials.filter((item) => {
      if (materialCategory !== 'Все' && item.category !== materialCategory) return false;
      if (!needle) return true;
      const haystack = [item.title, item.description, item.category, ...item.tags].join(' ').toLowerCase();
      return haystack.includes(needle);
    });
  }, [query, materialCategory]);

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
    setSelectedBlock(block);
    setSelectedRole('');
    setPage('matrix');
  }

  function handleGlobalSearch(value) {
    setQuery(value);
    if (value.trim()) {
      setPage('matrix');
    }
  }

  return (
    <>
      <header className="app-header">
        <div className="topbar">
          <button className="brand" onClick={() => setPage('overview')} aria-label="Открыть обзор">
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
          <a className="support-button" href="mailto:partners@axoft.ru">
            <HelpCircle size={18} />
            <span>Запросить помощь</span>
          </a>
        </div>
        <nav className="nav-tabs" aria-label="Разделы портала">
          {nav.map(({ id, label, icon: Icon }) => (
            <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}>
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main>
        {page === 'overview' && (
          <Overview
            matrixCount={matrix.length}
            blockCount={blocks.length}
            materialCount={materials.length}
            caseCount={cases.length}
            onOpenMap={() => setPage('map')}
            onOpenMatrix={() => openMatrix()}
            onOpenLibrary={() => setPage('library')}
          />
        )}
        {page === 'map' && <DirectionMap cards={mapCards} onOpenMatrix={openMatrix} />}
        {page === 'matrix' && (
          <MatrixView
            blocks={blocks}
            roles={roles}
            rows={filteredMatrix}
            selectedBlock={selectedBlock}
            selectedRole={selectedRole}
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
        {page === 'cases' && (
          <CasesView
            directions={caseDirections}
            activeDirection={caseDirection}
            setActiveDirection={setCaseDirection}
            cases={filteredCases}
          />
        )}
      </main>
    </>
  );
}

function Overview({ matrixCount, blockCount, materialCount, caseCount, onOpenMap, onOpenMatrix, onOpenLibrary }) {
  return (
    <section className="overview">
      <div className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={16} />
            Для партнеров и команд Axoft AM
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

function DirectionMap({ cards, onOpenMatrix }) {
  const labels = {
    strategic: 'Стратегический уровень',
    operational: 'Операционный уровень',
    technical: 'Технический уровень',
  };

  return (
    <section className="page-shell">
      <PageTitle
        icon={Map}
        title="Карта направлений"
        text="Выберите направление, чтобы сразу отфильтровать роли, задачи и решения в матрице."
      />
      <div className="legend">
        {Object.entries(labels).map(([level, label]) => (
          <span className={`legend-pill ${level}`} key={level}>
            {label}
          </span>
        ))}
      </div>
      <div className="map-grid">
        {cards.map((card) => (
          <button className={`direction-card ${card.level}`} key={card.block} onClick={() => onOpenMatrix(card.block)}>
            <span>{labels[card.level]}</span>
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

function MatrixView({ blocks, roles, rows, selectedBlock, selectedRole, setSelectedBlock, setSelectedRole, total }) {
  return (
    <section className="page-shell">
      <PageTitle
        icon={BarChart3}
        title="Матрица решений"
        text={`Показано ${rows.length} из ${total} строк. Фильтруйте по направлению или роли клиента.`}
      />
      <div className="filters">
        <Select label="Направление" value={selectedBlock} onChange={setSelectedBlock} options={['', ...blocks]} />
        <Select label="Роль клиента" value={selectedRole} onChange={setSelectedRole} options={['', ...roles]} />
        {(selectedBlock || selectedRole) && (
          <button className="clear-button" onClick={() => { setSelectedBlock(''); setSelectedRole(''); }}>
            Сбросить фильтры
          </button>
        )}
      </div>
      <div className="matrix-list">
        {rows.map((row) => (
          <article className="matrix-card" key={`${row.block}-${row.role}`}>
            <div className="matrix-head">
              <span className="role-avatar">{roleInitials(row.role)}</span>
              <div>
                <span className="block-label">{row.block}</span>
                <h3>{row.role}</h3>
              </div>
            </div>
            <Column title="Что беспокоит" items={row.pains} />
            <div>
              <h4>Решение Axoft</h4>
              <div className="solution-tags">
                {row.solutions.map((solution) => (
                  <span key={solution}>{solution}</span>
                ))}
              </div>
            </div>
            <Column title="Бизнес-результат" items={row.results} positive />
          </article>
        ))}
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

function Select({ label, value, onChange, options }) {
  return (
    <label className="select-wrap">
      <span>
        <Filter size={15} />
        {label}
      </span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option || 'all'} value={option}>
            {option || 'Все'}
          </option>
        ))}
      </select>
    </label>
  );
}

function Column({ title, items, positive = false }) {
  return (
    <div>
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
