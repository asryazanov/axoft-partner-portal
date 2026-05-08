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
import { cases as initialCases } from './data/cases.js';
import { caseIndustryDictionary } from './data/caseDictionaries.js';
import './styles.css';

const base = import.meta.env.BASE_URL;
const sessionKey = 'axoft-portal-user';
const buildMarker = 'rollback-clean-2026-05-06';
const supportEmail = 'partners@axoftglobal.ru';
const githubConfig = {
  owner: 'asryazanov',
  repo: 'axoft-partner-portal',
  branch: 'main',
  materialsPath: 'src/data/materials.js',
  casesPath: 'src/data/cases.js',
  assetsPath: 'public/assets/materials',
  caseAssetsPath: 'public/assets/cases',
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
  { id: 'overview', label: 'Обзор', icon: Layers3 },
  { id: 'advisor', label: 'Мастер подбора', icon: Target },
  { id: 'matrix', label: 'Матрица решений', icon: BarChart3 },
  { id: 'map', label: 'Карта направлений', icon: Map },
  { id: 'library', label: 'Материалы', icon: BookOpen },
  { id: 'cases', label: 'Кейсы', icon: BriefcaseBusiness },
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

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[()«»"']/g, ' ')
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();
}

function keywordTokens(values) {
  return unique(
    values
      .flatMap((value) => normalizeSearchText(value).split(/[\s,/+-]+/))
      .map((token) => token.trim())
      .filter((token) => token.length > 2 && !['для', 'под', 'или', 'при', 'это', 'как'].includes(token)),
  );
}

function matchScore(itemValues, terms) {
  const haystack = normalizeSearchText(itemValues.flat().filter(Boolean).join(' '));
  return terms.reduce((score, term) => score + (haystack.includes(normalizeSearchText(term)) ? 1 : 0), 0);
}

function advisorQuestionsFor(row, pain) {
  if (!row) return [];
  const role = normalizeSearchText(row.role);
  const block = normalizeSearchText(row.block);
  const normalizedPain = normalizeSearchText(pain);
  const q = (question, reason) => ({ question, reason });
  const commonIntro = pain
    ? q(
        `Почему задача “${pain}” стала актуальной именно сейчас и что произойдёт, если её не решить в ближайшие 6-12 месяцев?`,
        'Проверяем срочность, реальный бизнес-драйвер и риск бездействия.',
      )
    : q(
        'Какая из задач сейчас создаёт наибольшее давление на бизнес и почему её нужно решать первой?',
        'Помогаем заказчику выбрать приоритет и не распылять разговор на всё сразу.',
      );
  let roleSpecific = [];

  if (role.includes('генеральный') || role.includes('ceo')) {
    roleSpecific = [
      q('Какие 2-3 стратегические цели по производству и эффективности стоят на 2026-2028 годы?', 'Понимаем, к каким целям привязать предложение и язык бизнес-эффекта.'),
      q('Какие показатели совет директоров или собственники смотрят в первую очередь: EBITDA, себестоимость, выпуск, сроки, безопасность, качество?', 'Выявляем метрики, через которые CEO будет оценивать ценность проекта.'),
      q('Где сейчас не хватает управляемости: данные запаздывают, разные версии правды, нет прозрачности по площадкам или сложно контролировать KPI?', 'Связываем боль с управленческой задачей, а не только с ИТ-системой.'),
      q('Какой экономический эффект будет достаточным, чтобы проект получил приоритет и бюджет?', 'Проверяем порог окупаемости и аргументацию для инвестиционного решения.'),
    ];
  } else if (role.includes('производств')) {
    roleSpecific = [
      q('Где именно теряется эффективность: простои, переналадка, ожидание материалов, ручной ввод данных, несинхронность план-факта?', 'Локализуем производственную боль и выбираем релевантный класс решения.'),
      q('Какие показатели нужно улучшить первыми: OEE, выпуск в смену, себестоимость, брак, выполнение плана, длительность цикла?', 'Переводим разговор в измеримые производственные KPI.'),
      q('Как сейчас собираются данные с участков и насколько им доверяют мастера, технологи и руководство?', 'Проверяем качество данных и готовность к MES/SCADA/аналитике.'),
      q('Какие ограничения есть на площадке: сменность, регламенты, простой оборудования, доступ к АСУ ТП, требования промышленной безопасности?', 'Выявляем внедренческие ограничения до предложения решения.'),
    ];
  } else if (role.includes('техническ') || role.includes('cto')) {
    roleSpecific = [
      q('Какие системы уже есть в контуре: ERP, MES, SCADA, АСУ ТП, WMS, BI, 1С, самописные решения?', 'Строим карту текущей архитектуры и будущих интеграций.'),
      q('Где сейчас основные технические ограничения: устаревшие системы, закрытые протоколы, качество данных, инфраструктура, ИБ, отказоустойчивость?', 'Понимаем риски реализации и требования к архитектуре.'),
      q('Какие данные нужны для решения задачи и где они физически находятся?', 'Проверяем доступность источников данных и сложность интеграции.'),
      q('Есть ли требования по импортонезависимости, реестру российского ПО, on-premise, кластеризации или работе в изолированном контуре?', 'Формируем технические критерии подбора вендоров.'),
    ];
  } else if (role.includes('качеств')) {
    roleSpecific = [
      q('На каком этапе чаще всего возникают дефекты: входной контроль, производство, лаборатория, упаковка, отгрузка, эксплуатация?', 'Определяем точку процесса, где решение даст максимальный эффект.'),
      q('Как сейчас фиксируются несоответствия, причины брака, корректирующие действия и повторяемость дефектов?', 'Проверяем зрелость процесса качества и потребность в цифровом контуре.'),
      q('Какие требования нужно закрыть: ISO, отраслевые стандарты, регуляторика, внутренние аудиты, требования заказчиков?', 'Выявляем обязательные критерии и риски несоответствия.'),
      q('Какие данные по качеству сейчас недоступны в моменте или собираются вручную?', 'Ищем аргумент для автоматизации контроля и аналитики.'),
    ];
  } else if (role.includes('инженер') || block.includes('эксплуатац')) {
    roleSpecific = [
      q('Какие группы оборудования чаще всего создают внеплановые простои и самые дорогие ремонты?', 'Выбираем пилотный контур, где эффект будет быстро доказуем.'),
      q('Как сейчас планируются ТОиР: по регламенту, по состоянию, по авариям, по наработке или вручную?', 'Понимаем зрелость эксплуатации и потенциал предиктивного подхода.'),
      q('Какие данные по оборудованию доступны: вибрация, температура, токи, журналы ремонтов, простои, причины отказов?', 'Проверяем, можно ли строить мониторинг и аналитику состояния.'),
      q('Где теряется время ремонтных служб: диагностика, согласования, запчасти, наряды, отчётность, поиск истории отказов?', 'Находим операционные узкие места для цифровизации ТОиР.'),
    ];
  } else if (role.includes('финансов')) {
    roleSpecific = [
      q('Какие статьи производственных затрат сейчас сложнее всего контролировать: сырьё, энергия, ремонты, персонал, логистика, простои?', 'Определяем финансовый контур, где нужен прозрачный расчёт эффекта.'),
      q('Как рассчитывается себестоимость и где чаще всего возникают расхождения между планом, фактом и управленческой отчётностью?', 'Проверяем качество финансовой модели и данных.'),
      q('Какие решения уже используются для бюджетирования, план-факт анализа, BI, EPM, RPA или закрытия периода?', 'Понимаем ИТ-ландшафт финансового блока.'),
      q('Какой ROI, срок окупаемости или эффект по снижению затрат нужен, чтобы проект прошёл согласование?', 'Выявляем финансовые критерии одобрения.'),
    ];
  } else if (role.includes('логист')) {
    roleSpecific = [
      q('Где больше всего потерь: склад, транспорт, дворы, отгрузка, запасы, пересортица, простои транспорта?', 'Определяем точку логистического эффекта.'),
      q('Какие метрики сейчас проседают: точность инвентаризации, скорость обработки, OTIF, загрузка транспорта, стоимость хранения?', 'Привязываем решение к логистическим KPI.'),
      q('Как связаны склад, производство, продажи и закупки: где возникают разрывы данных или ручные согласования?', 'Проверяем потребность в WMS/TMS/YMS и интеграции с ERP.'),
      q('Какие ограничения есть на складе или площадке: маркировка, ТСД, Wi-Fi, весовое оборудование, пропускной режим, сменность?', 'Снимаем технические и организационные ограничения внедрения.'),
    ];
  } else if (role.includes('закуп')) {
    roleSpecific = [
      q('Какие категории закупок наиболее критичны для непрерывности производства?', 'Выявляем зоны, где цифровизация закупок снижает бизнес-риск.'),
      q('Где сейчас основные потери: цена, сроки, дефицит, качество поставок, согласования, поставщики, остатки?', 'Понимаем, какой эффект важнее: экономия, скорость или надёжность.'),
      q('Как закупки связаны с планом производства и складскими остатками?', 'Проверяем наличие разрыва между потребностью, закупкой и фактическим обеспечением.'),
      q('Какие требования есть к прозрачности процедур, конкурсам, комплаенсу и контролю поставщиков?', 'Определяем функциональные и регуляторные требования.'),
    ];
  } else if (role.includes('персонал') || role.includes('hr')) {
    roleSpecific = [
      q('Какие кадровые ограничения сильнее всего влияют на производство: дефицит, текучесть, квалификация, графики, охрана труда?', 'Понимаем, где HR-задача напрямую влияет на производственный результат.'),
      q('Какие HR-процессы сейчас наиболее ручные: подбор, адаптация, обучение, графики, кадровые документы, оценка?', 'Определяем процессы для автоматизации.'),
      q('Как измеряется эффект HR для бизнеса: time-to-hire, текучесть, закрытие смен, производительность, затраты на персонал?', 'Связываем HR-проект с бизнес-KPI.'),
      q('Какие системы уже используются: кадровая система, портал, СЭД, LMS, табель, расчёт зарплаты?', 'Проверяем интеграции и текущий ИТ-контур HR.'),
    ];
  } else if (role.includes('коммерчес')) {
    roleSpecific = [
      q('В каких сегментах клиентов и продуктов ожидается основной рост в 2026-2028 годах?', 'Понимаем коммерческий приоритет и потенциал масштабирования.'),
      q('Где теряется конверсия: лидогенерация, квалификация, расчёт КП, согласование условий, сопровождение сделки?', 'Выявляем узкие места коммерческого процесса.'),
      q('Как сейчас прогнозируются продажи, маржинальность, отгрузки и загрузка производства?', 'Проверяем связь продаж с производственным планированием.'),
      q('Какие данные о клиентах, заказах и сервисе недоступны менеджерам в момент принятия решения?', 'Ищем аргумент для CRM/аналитики/автоматизации продаж.'),
    ];
  } else if (role.includes('проект')) {
    roleSpecific = [
      q('Какие проекты сейчас наиболее критичны по срокам, бюджету и влиянию на производство?', 'Определяем проекты, где управление портфелем даст быстрый эффект.'),
      q('Как фиксируются статусы, риски, отклонения по срокам и бюджету?', 'Проверяем прозрачность проектного управления.'),
      q('Как принимаются решения о приоритетах портфеля и перераспределении ресурсов?', 'Понимаем управленческий процесс и участников согласования.'),
      q('Какие системы уже используются для проектов, задач, документов, бюджета и отчётности?', 'Выявляем текущий ИТ-контур и интеграции.'),
    ];
  }

  if (!roleSpecific.length) {
    roleSpecific = [
      q(`Как выбранная роль влияет на задачу “${pain || row.block}” и какие решения она может согласовать?`, 'Уточняем полномочия участника и его роль в покупке.'),
      q('Какие показатели в зоне ответственности роли должны измениться после проекта?', 'Фиксируем персональные KPI и критерии ценности.'),
      q('Какие данные, системы и процессы уже используются в этой зоне?', 'Понимаем текущий контур и интеграции.'),
      q('Какие ограничения могут помешать внедрению: люди, бюджет, сроки, ИТ, безопасность, регламенты?', 'Выявляем риски сделки и проекта.'),
    ];
  }

  const painSpecific = [];
  if (normalizedPain.includes('затрат') || normalizedPain.includes('себестоим') || normalizedPain.includes('фонд')) {
    painSpecific.push(q('Из чего складываются текущие потери или затраты и какая их часть подтверждена цифрами?', 'Проверяем финансовую доказательную базу для предложения.'));
    painSpecific.push(q('Кто владеет расчётом эффекта и какие данные нужны, чтобы подтвердить экономию?', 'Понимаем, кого подключать для бизнес-кейса.'));
  } else if (normalizedPain.includes('kpi') || normalizedPain.includes('контрол') || normalizedPain.includes('картин')) {
    painSpecific.push(q('Какие KPI сейчас контролируются регулярно, а какие видны слишком поздно для управленческого решения?', 'Ищем ценность мониторинга, BI или управленческой отчётности.'));
    painSpecific.push(q('Где возникают разные версии правды: между площадками, сменами, производством, финансами или ИТ?', 'Выявляем потребность в едином контуре данных.'));
  } else if (normalizedPain.includes('качеств') || normalizedPain.includes('брак') || normalizedPain.includes('дефект')) {
    painSpecific.push(q('Как сейчас выявляются причины брака и сколько времени занимает расследование инцидента качества?', 'Оцениваем потенциал автоматизации качества и аналитики причин.'));
    painSpecific.push(q('Какие данные нужны, чтобы связать дефект с партией, сменой, оборудованием, сырьём или оператором?', 'Понимаем глубину трассируемости.'));
  } else if (normalizedPain.includes('прост') || normalizedPain.includes('авар') || normalizedPain.includes('ремонт') || normalizedPain.includes('оборуд')) {
    painSpecific.push(q('Какие простои самые дорогие и как сейчас фиксируются причины остановок?', 'Проверяем экономику ТОиР, мониторинга или предиктивной аналитики.'));
    painSpecific.push(q('Есть ли история отказов и достаточно ли данных, чтобы перейти от регламентного ремонта к ремонту по состоянию?', 'Оцениваем готовность к предиктивному сценарию.'));
  } else if (normalizedPain.includes('автоматизац') || normalizedPain.includes('ручн') || normalizedPain.includes('отчет')) {
    painSpecific.push(q('Какие операции сейчас выполняются вручную и сколько времени они занимают у ключевых сотрудников?', 'Оцениваем эффект от автоматизации и высвобождения времени.'));
    painSpecific.push(q('Какие ошибки или задержки появляются из-за ручного ввода, Excel или несогласованных справочников?', 'Выявляем операционные риски и аргументы для цифровизации.'));
  } else if (normalizedPain.includes('запас') || normalizedPain.includes('склад') || normalizedPain.includes('логист') || normalizedPain.includes('постав')) {
    painSpecific.push(q('Где чаще возникает дефицит или избыточный запас и как это влияет на производство или отгрузки?', 'Связываем логистическую проблему с бизнес-потерями.'));
    painSpecific.push(q('Какие данные по запасам, заказам и перемещениям сейчас недостоверны или обновляются с задержкой?', 'Проверяем потребность в WMS/TMS/SRM и интеграции.'));
  } else {
    painSpecific.push(q(`Как сейчас измеряется задача “${pain || row.block}” и какие цифры подтвердят улучшение?`, 'Переводим формулировку боли в измеримый KPI.'));
    painSpecific.push(q('Какие процессы, подразделения и системы затронет решение этой задачи?', 'Определяем границы проекта и участников.'));
  }

  return [
    commonIntro,
    ...roleSpecific,
    ...painSpecific,
    q('Какие системы уже используются и какие интеграции будут обязательны для будущего решения?', 'Фиксируем ИТ-ландшафт и требования к совместимости.'),
    q('Кто принимает решение, кто влияет на выбор и кто будет владельцем результата после внедрения?', 'Строим карту стейкхолдеров и следующий состав встречи.'),
    q('Есть ли уже бюджет, программа цифровизации или окно проекта на 2026-2028 годы?', 'Проверяем реалистичность сделки, сроки и источник финансирования.'),
    q('Какой следующий шаг будет самым полезным: воркшоп с Axoft и вендором, демо, экспресс-аудит, пилот или сбор требований под ТЗ?', 'Закрываем встречу конкретным действием и понятной ответственностью.'),
  ].slice(0, 10);
}

function advisorRoleReason(primaryRow, relatedRow) {
  if (!primaryRow || !relatedRow) return 'Поможет уточнить требования и подтвердить ценность решения со своей стороны.';
  if (primaryRow.role === relatedRow.role) {
    return 'Основной участник встречи: с него удобно начать проверку боли, приоритетов и бизнес-эффекта.';
  }
  if (primaryRow.block === relatedRow.block) {
    return 'Работает в том же направлении и поможет подтвердить смежные процессы, ограничения и ожидаемый эффект.';
  }

  const role = normalizeSearchText(relatedRow.role);
  if (role.includes('генеральный') || role.includes('ceo')) return 'Поможет закрепить стратегический приоритет и экономический эффект проекта.';
  if (role.includes('финансов')) return 'Поможет подтвердить экономику проекта, бюджетные ограничения и финансовые KPI.';
  if (role.includes('техническ') || role.includes('cto') || role.includes('инженер')) return 'Поможет проверить технологическую реализуемость, архитектуру и интеграционные ограничения.';
  if (role.includes('производств')) return 'Поможет подтвердить операционную боль, производственные метрики и требования к внедрению.';
  if (role.includes('качеств')) return 'Поможет оценить влияние решения на качество, соответствие требованиям и снижение дефектов.';
  if (role.includes('логист')) return 'Поможет проверить влияние решения на склад, запасы, транспорт и цепочку поставок.';
  if (role.includes('закуп')) return 'Поможет уточнить требования к поставщикам, закупочным процедурам и срокам обеспечения.';
  if (role.includes('персонал') || role.includes('hr')) return 'Поможет оценить влияние на персонал, обучение, графики и организационные изменения.';
  return 'Поможет расширить контекст встречи и увидеть смежные требования до подготовки предложения.';
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

function emptyCase() {
  return {
    id: '',
    title: '',
    company: '',
    customerDescription: '',
    region: '',
    scale: '',
    period: '',
    direction: '',
    industry: '',
    subIndustry: '',
    segment: '',
    solution: '',
    vendorsText: '',
    productsText: '',
    tagsText: '',
    status: 'draft',
    confidentiality: 'nda',
    isAnonymized: true,
    sourceName: '',
    sourceUrl: '',
    summary: '',
    goalsText: '',
    problemText: '',
    implementationText: '',
    technologiesText: '',
    projectScaleText: '',
    resultsText: '',
    metrics: '',
    duration: '',
    realizationScale: '',
    vendorNote: '',
    relatedMaterialsText: '',
    attachmentsText: '',
    result: '',
  };
}

function splitLines(value) {
  return value
    .split(/\n|;/)
    .map((item) => item.trim().replace(/^[-•]\s*/, ''))
    .filter(Boolean);
}

function splitComma(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function caseToForm(item) {
  return {
    ...item,
    vendorsText: (item.vendors || []).join(', '),
    productsText: (item.products || []).join(', '),
    tagsText: (item.tags || []).join(', '),
    goalsText: (item.goals || []).join('\n'),
    problemText: (item.problem || []).join('\n'),
    implementationText: (item.implementation || []).join('\n'),
    technologiesText: (item.technologies || []).join(', '),
    projectScaleText: (item.projectScale || []).join('\n'),
    resultsText: (item.results || []).join('\n'),
    relatedMaterialsText: (item.relatedMaterials || []).join(', '),
    attachmentsText: (item.attachments || []).map((attachment) => [attachment.title, attachment.href, attachment.format].filter(Boolean).join(' | ')).join('\n'),
  };
}

function normalizeCase(form) {
  return {
    id: String(form.id).trim(),
    title: form.title.trim(),
    company: form.company.trim(),
    customerDescription: form.customerDescription.trim(),
    region: form.region.trim(),
    scale: form.scale.trim(),
    period: form.period.trim(),
    direction: form.direction.trim(),
    industry: form.industry.trim(),
    subIndustry: form.subIndustry.trim(),
    segment: form.segment.trim(),
    solution: form.solution.trim(),
    vendors: splitComma(form.vendorsText),
    products: splitComma(form.productsText),
    tags: splitComma(form.tagsText),
    status: form.status,
    confidentiality: form.confidentiality,
    isAnonymized: Boolean(form.isAnonymized),
    sourceName: form.sourceName.trim(),
    sourceUrl: form.sourceUrl.trim(),
    summary: form.summary.trim(),
    goals: splitLines(form.goalsText),
    problem: splitLines(form.problemText),
    implementation: splitLines(form.implementationText),
    technologies: splitComma(form.technologiesText),
    projectScale: splitLines(form.projectScaleText),
    results: splitLines(form.resultsText),
    metrics: form.metrics.trim(),
    duration: form.duration.trim(),
    realizationScale: form.realizationScale.trim(),
    vendorNote: form.vendorNote.trim(),
    relatedMaterials: splitComma(form.relatedMaterialsText),
    attachments: splitLines(form.attachmentsText).map((line) => {
      const [title, href, format] = line.split('|').map((part) => part.trim());
      return { title, href, format: (format || 'LINK').toUpperCase() };
    }),
    result: form.result.trim(),
  };
}

function caseModuleSource(items) {
  return `export const cases = ${JSON.stringify(items, null, 2)};\n`;
}

const materialCategoryOptions = [
  'Промышленные решения',
  'Кибербезопасность',
  'Решения для бизнеса',
  'Общие материалы',
];

const materialFieldHints = {
  id: 'Технический ID материала для хранения в GitHub. Используйте латиницу, цифры и дефисы, например industrial-map.',
  format: 'Формат файла или ссылки. Если загружаете файл, формат подставится автоматически по расширению.',
  title: 'Название, которое партнёр увидит в библиотеке. Лучше коротко указать тему и тип материала.',
  version: 'Версия, дата или период актуальности материала. Помогает партнёрам понять, что файл свежий.',
  category: 'Выберите одну из четырёх категорий библиотеки. От неё зависит, в какой плашке появится материал.',
  tagsText: 'Короткие теги через запятую: отрасль, продукт, сценарий, аудитория. Они участвуют в поиске.',
  description: 'Кратко опишите, чем полезен материал и когда его стоит использовать. Достаточно 1-2 предложений.',
  href: 'Путь к опубликованному файлу или внешняя ссылка. Для загруженных файлов используйте /assets/materials/имя-файла.',
  file: 'Загрузите файл материала. После выбора путь и формат будут заполнены автоматически.',
  token: 'Token нужен только для публикации изменений в GitHub. В портале он не сохраняется.',
};

const advisorBlockHints = {
  meetingPlan: 'Последовательность первой встречи. Используйте как agenda: проверить контекст, подтвердить боль, показать варианты и договориться о следующем шаге.',
  questions: 'Вопросы адаптируются под роль и выбранную боль. Используйте их для исследовательского разговора и фиксации критериев успеха.',
  solutions: 'Список решений из матрицы и вендоров из релевантных кейсов. Используйте как основу для обсуждения, кого подключать к следующей встрече. Все запросы по подбору решений, вендоров и материалов направляйте в Axoft.',
  cases: 'Кейсы, близкие к выбранной роли, боли и решениям. Открывайте их на встрече или используйте как подтверждение опыта.',
  materials: 'Материалы, которые можно отправить партнёру или заказчику после разговора. Начинайте с самых релевантных промышленному сценарию.',
  roles: 'Смежные роли у заказчика. Это подсказка, кого стоит подключить, чтобы подтвердить экономику, технологию и внедрение.',
};

const caseFieldHints = {
  id: 'Технический идентификатор кейса для хранения в GitHub. Используйте латиницу, цифры и дефисы, например mes-mining-exemes.',
  status: 'Черновик не показывается партнёрам. Опубликовано видно в разделе кейсов. Скрыто временно убирает кейс из публичного каталога.',
  confidentiality: 'Укажите режим использования кейса: публичный, закрытый под NDA или анонимизированный. Перед публикацией убедитесь, что есть разрешение заказчика.',
  isAnonymized: 'Включите, если название заказчика или чувствительные детали заменены обобщениями. Для закрытых кейсов под NDA это обычно обязательный режим.',
  title: 'Краткое, ёмкое название проекта/решения. Название должно отражать суть решения в 5-10 словах.',
  company: 'Для публичных кейсов укажите полное официальное название только при наличии разрешения. Для NDA-кейсов используйте обобщение: крупная горнодобывающая компания, нефтехимический комбинат и т.д.',
  region: 'Основной регион деятельности или регион реализации проекта.',
  industry: 'Выберите основную отрасль из справочника. От отрасли зависят доступные подотрасли.',
  subIndustry: 'Выберите подотрасль из справочника после выбора отрасли.',
  segment: 'Выберите сегмент из справочника после выбора подотрасли.',
  scale: 'Ключевой масштаб проекта: количество пользователей, объектов, площадок, рабочих мест, объём данных и т.д.',
  period: 'Дата начала и завершения проекта или диапазон лет, например 2022-2026.',
  solution: 'Класс или тип решения, по которому партнёр будет искать кейс: MES, WMS, BI, SCADA, ИБ и т.д.',
  vendorsText: 'Укажите вендоров через запятую. Для этого портала важно быстро найти кейс по вендору, который был внедрён.',
  productsText: 'Укажите продукты или платформы через запятую. Если продукт совпадает с вендором, можно повторить его здесь.',
  tagsText: 'Теги через запятую: отрасль, сценарий, технология, ключевой эффект. Они помогают поиску и быстрому сканированию.',
  customerDescription: 'Сфера деятельности, размер и основные направления заказчика. Не добавляйте персональные данные и конфиденциальные детали без разрешения.',
  summary: 'Суть проекта и основной результат в 2-3 предложениях. Сосредоточьтесь на главном результате и выгоде для заказчика.',
  goalsText: 'Основная цель и задачи проекта. Задачи лучше писать как конкретные шаги для достижения цели.',
  problemText: 'Опишите проблемы и вызовы до проекта, а также их влияние на бизнес. Хорошо работают конкретные примеры и цифры.',
  implementationText: 'Опишите, как было реализовано решение: компоненты, архитектура, интеграции, нестандартные доработки.',
  projectScaleText: 'Перечислите масштаб: пользователи, филиалы, площадки, объёмы данных, интеграции, производственные объекты.',
  resultsText: 'Что было достигнуто в результате проекта. Укажите выгоды для заказчика: сокращение затрат, рост производительности, снижение ошибок.',
  technologiesText: 'Технологии и интеграции через запятую: API, ERP, 1С, протоколы, платформы, инфраструктурные компоненты.',
  realizationScale: 'Масштаб реализации: локальный, региональный, федеральный или международный.',
  result: 'Короткий результат для карточки кейса. Лучше использовать конкретный бизнес-эффект, который партнёр увидит в списке.',
  sourceName: 'Название публичного источника или компании, чей публичный кейс можно показать партнёру.',
  sourceUrl: 'Ссылка на публичный кейс, статью, страницу проекта или другой источник. Не добавляйте закрытые ссылки.',
  relatedMaterialsText: 'ID связанных материалов из библиотеки через запятую. Они появятся в карточке кейса как дополнительные материалы.',
  attachmentsText: 'Одна строка на приложение: название | ссылка | формат. Можно указать презентации, статьи, видео, схемы, диаграммы.',
  file: 'Прикрепите PDF, XLSX, PPTX или другой файл к кейсу. Файл будет загружен в GitHub при публикации.',
};

function dictionaryValues(field, filters = {}) {
  return unique(
    caseIndustryDictionary
      .filter((item) => !filters.industry || item.industry === filters.industry)
      .filter((item) => !filters.subIndustry || item.subIndustry === filters.subIndustry)
      .map((item) => item[field]),
  );
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
  const [page, setPage] = useState('overview');
  const [query, setQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [materialCategory, setMaterialCategory] = useState('Все');
  const [materialStore, setMaterialStore] = useState(initialMaterials);
  const [caseStore, setCaseStore] = useState(initialCases);
  const [caseFilters, setCaseFilters] = useState({
    vendor: '',
    solution: '',
    industry: '',
    subIndustry: '',
    region: '',
    scale: '',
    period: '',
    tag: '',
  });

  const blocks = useMemo(() => unique(matrix.map((item) => item.block)), []);
  const roles = useMemo(() => unique(matrix.map((item) => item.role)), []);
  const materialCategories = useMemo(() => ['Все', ...unique(materialStore.map((item) => item.category))], [materialStore]);
  const publishedCases = useMemo(() => caseStore.filter((item) => item.status === 'published'), [caseStore]);
  const caseOptions = useMemo(
    () => ({
      vendors: unique(publishedCases.flatMap((item) => item.vendors || [])),
      solutions: unique(publishedCases.map((item) => item.solution)),
      industries: unique(publishedCases.map((item) => item.industry)),
      subIndustries: unique(publishedCases.map((item) => item.subIndustry)),
      regions: unique(publishedCases.map((item) => item.region)),
      scales: unique(publishedCases.map((item) => item.scale)),
      periods: unique(publishedCases.map((item) => item.period)),
      tags: unique(publishedCases.flatMap((item) => item.tags || [])),
    }),
    [publishedCases],
  );
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
    return publishedCases.filter((item) => {
      if (caseFilters.vendor && !(item.vendors || []).includes(caseFilters.vendor)) return false;
      if (caseFilters.solution && item.solution !== caseFilters.solution) return false;
      if (caseFilters.industry && item.industry !== caseFilters.industry) return false;
      if (caseFilters.subIndustry && item.subIndustry !== caseFilters.subIndustry) return false;
      if (caseFilters.region && item.region !== caseFilters.region) return false;
      if (caseFilters.scale && item.scale !== caseFilters.scale) return false;
      if (caseFilters.period && item.period !== caseFilters.period) return false;
      if (caseFilters.tag && !(item.tags || []).includes(caseFilters.tag)) return false;
      if (!needle) return true;
      const haystack = [
        item.title,
        item.company,
        item.region,
        item.direction,
        item.industry,
        item.subIndustry,
        item.segment,
        item.solution,
        item.result,
        ...(item.vendors || []),
        ...(item.products || []),
        ...(item.tags || []),
      ].join(' ').toLowerCase();
      return haystack.includes(needle);
    });
  }, [query, caseFilters, publishedCases]);

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
          <a className="support-button" href={`mailto:${supportEmail}`} title="Запросить помощь" aria-label="Запросить помощь">
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
          <a className="sidebar-help" href={`mailto:${supportEmail}`}>
            <Mail size={17} />
            {supportEmail}
          </a>
        </aside>

        <main>
          {page === 'overview' && (
            <Overview
              user={currentUser}
              matrixCount={matrix.length}
              blockCount={blocks.length}
              materialCount={materialStore.length}
              caseCount={publishedCases.length}
              onOpenMap={() => setPage('map')}
              onOpenMatrix={() => openMatrix()}
              onOpenLibrary={() => setPage('library')}
            />
          )}
          {page === 'advisor' && (
            <CustomerAdvisor
              rows={matrix}
              materials={materialStore}
              cases={publishedCases}
              onOpenMatrix={openMatrix}
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
          {page === 'admin' && currentUser.isAdmin && (
            <AdminPanel
              materials={materialStore}
              cases={caseStore}
              onMaterialsUpdate={setMaterialStore}
              onCasesUpdate={setCaseStore}
            />
          )}
          {page === 'cases' && (
            <CasesView
              options={caseOptions}
              filters={caseFilters}
              setFilters={setCaseFilters}
              cases={filteredCases}
              materials={materialStore}
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
          <h1>Входим в промышленный бизнес вместе с Axoft</h1>
          <p>
            Axoft подготовил для партнёров материалы для работы с заказчиками по промышленным решениям:
            матрицу ролей, готовые аргументы, кейсы и файлы для первого содержательного диалога.
          </p>
          <ol className="hero-steps">
            <li>Выберем 1-3 промышленных заказчиков с высоким уровнем доверия.</li>
            <li>Подберём 3-5 вендоров под их боли и проекты на 2026-2028 годы.</li>
            <li>Проведём первую установочную встречу вместе с Axoft.</li>
            <li>Соберём предложение под ТЗ: партнёр, Axoft и вендоры.</li>
            <li>Зайдём в новый бизнес плавно, с минимумом ресурсов и максимумом промышленной экспертизы.</li>
          </ol>
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

function CustomerAdvisor({ rows, materials, cases, onOpenMatrix, onOpenLibrary }) {
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedPain, setSelectedPain] = useState('');
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [activeCase, setActiveCase] = useState(null);
  const selectedRow = rows.find((item) => item.role === selectedRole) || null;
  const painOptions = selectedRow?.pains || [];
  const terms = selectedRow
    ? keywordTokens([selectedRow.role, selectedRow.block, selectedPain, ...selectedRow.pains, ...selectedRow.solutions])
    : [];
  const relatedRoles = selectedRow
    ? rows
        .filter((item) => item.role !== selectedRow.role)
        .map((item) => ({
          item,
          score:
            (item.block === selectedRow.block ? 2 : 0) +
            matchScore([item.role, item.block, item.pains, item.solutions], terms),
        }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(({ item }) => ({
          item,
          reason: advisorRoleReason(selectedRow, item),
        }))
    : [];
  const recommendedCases = selectedRow
    ? cases
        .map((item) => ({
          item,
          score: matchScore(
            [
              item.title,
              item.company,
              item.industry,
              item.subIndustry,
              item.segment,
              item.solution,
              item.direction,
              item.result,
              item.problem,
              item.implementation,
              item.vendors,
              item.products,
              item.tags,
            ],
            terms,
          ),
        }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(({ item }) => item)
    : [];
  const recommendedMaterials = selectedRow
    ? materials
        .map((item) => ({
          item,
          score: matchScore([item.title, item.description, item.category, item.tags], terms),
        }))
        .filter(({ score, item }) => score > 0 || item.category === 'Промышленные решения')
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
        .map(({ item }) => item)
    : [];
  const vendors = unique(recommendedCases.flatMap((item) => [...(item.vendors || []), ...(item.products || [])])).slice(0, 8);
  const meetingPlan = selectedRow
    ? [
        `Зафиксировать контекст заказчика и роль участника: ${selectedRow.role}.`,
        selectedPain ? `Проверить, насколько актуальна боль: ${selectedPain}.` : 'Выбрать 1-2 ключевые боли для обсуждения на встрече.',
        'Показать релевантные решения Axoft и согласовать, какие вендоры стоит подключить.',
        'Договориться о следующем шаге: техническая сессия, демо или сбор требований под ТЗ.',
      ]
    : [];
  const connectedRoles = selectedRow
    ? [{ item: selectedRow, reason: advisorRoleReason(selectedRow, selectedRow) }, ...relatedRoles]
    : [];
  const discoveryQuestions = advisorQuestionsFor(selectedRow, selectedPain);
  const visibleQuestions = showAllQuestions ? discoveryQuestions : discoveryQuestions.slice(0, 5);
  const hiddenQuestionCount = Math.max(discoveryQuestions.length - visibleQuestions.length, 0);

  function chooseRole(role) {
    setSelectedRole(role);
    setSelectedPain('');
    setShowAllQuestions(false);
  }

  function choosePain(pain) {
    setSelectedPain(pain);
    setShowAllQuestions(false);
  }

  return (
    <section className="page-shell advisor-page">
      <PageTitle
        icon={Target}
        title="Мастер подбора захода"
        text="Выберите роль и боль заказчика, чтобы быстро собрать рекомендации для первой встречи."
      />

      <div className="advisor-layout">
        <aside className="advisor-steps">
          <div className="advisor-step done">
            <span>1</span>
            <div>
              <strong>Отрасль</strong>
              <p>Промышленность</p>
            </div>
          </div>
          <label className="advisor-field">
            <span>2. Роль клиента</span>
            <select value={selectedRole} onChange={(event) => chooseRole(event.target.value)}>
              <option value="">Выберите роль</option>
              {rows.map((item) => (
                <option key={item.role} value={item.role}>
                  {item.role}
                </option>
              ))}
            </select>
          </label>
          <div className="advisor-field">
            <span>3. Боль / задача клиента</span>
            {selectedRow ? (
              <div className="pain-tile-grid" role="radiogroup" aria-label="Боль или задача клиента">
                {painOptions.map((pain) => (
                  <button
                    type="button"
                    key={pain}
                    className={selectedPain === pain ? 'active' : ''}
                    onClick={() => choosePain(pain)}
                    role="radio"
                    aria-checked={selectedPain === pain}
                  >
                    {pain}
                  </button>
                ))}
              </div>
            ) : (
              <div className="pain-empty">Сначала выберите роль</div>
            )}
          </div>
          <div className="advisor-actions">
            <button type="button" className="secondary-action" onClick={() => onOpenMatrix(selectedRow?.block || '')} disabled={!selectedRow}>
              Открыть в матрице
            </button>
            <button type="button" className="secondary-action" onClick={onOpenLibrary}>
              Материалы
            </button>
          </div>
        </aside>

        <div className="advisor-results">
          {!selectedRow ? (
            <div className="empty-state">
              <Target size={28} />
              <h3>Начните с роли клиента</h3>
              <p>После выбора мастер покажет подходящие решения, вендоров, материалы, кейсы и план первой встречи.</p>
            </div>
          ) : (
            <>
              <div className="advisor-summary">
                <span>{['Промышленность', selectedRow.role, selectedPain].filter(Boolean).join(' → ')}</span>
                <h3>{selectedRow.role}</h3>
                <p>{selectedPain || 'Выберите боль, чтобы точнее сфокусировать рекомендации.'}</p>
              </div>

              <div className="advisor-next">
                <h3>Что сделать сейчас</h3>
                <div>
                  <span>1</span>
                  <strong>Задайте первые 5 вопросов</strong>
                  <p>Начните с блока подготовки, чтобы быстро проверить боль, бюджет, сроки и критерии успеха.</p>
                </div>
                <div>
                  <span>2</span>
                  <strong>Обсудите решения и вендоров</strong>
                  <p>Используйте список как основу для запроса в Axoft и подключения вендорской экспертизы.</p>
                </div>
                <div>
                  <span>3</span>
                  <strong>Подкрепите разговор доказательствами</strong>
                  <p>Откройте релевантный кейс и отправьте подходящие материалы после встречи.</p>
                </div>
              </div>

              <section className="advisor-zone">
                <div className="advisor-zone-title">
                  <span>Подготовка встречи</span>
                  <p>Сценарий разговора, который помогает быстро выйти на следующий шаг.</p>
                </div>
                <div className="advisor-grid">
                  <AdvisorCard title="План первой встречи" hint={advisorBlockHints.meetingPlan}>
                    <ol className="number-list">
                      {meetingPlan.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ol>
                  </AdvisorCard>

                  <AdvisorCard title="Вопросы заказчику" hint={advisorBlockHints.questions}>
                    <ol className="advisor-question-list">
                      {visibleQuestions.map((item) => (
                        <li key={item.question}>
                          <strong>{item.question}</strong>
                          <span>Зачем: {item.reason}</span>
                        </li>
                      ))}
                    </ol>
                    {discoveryQuestions.length > 5 && (
                      <button type="button" className="show-more-button" onClick={() => setShowAllQuestions((current) => !current)}>
                        {showAllQuestions ? 'Скрыть полный сценарий' : `Показать полный сценарий +${hiddenQuestionCount}`}
                      </button>
                    )}
                  </AdvisorCard>
                </div>
              </section>

              <section className="advisor-zone">
                <div className="advisor-zone-title">
                  <span>Что предложить</span>
                  <p>Решения и вендоры для первичного обсуждения с заказчиком и Axoft.</p>
                </div>
                <AdvisorCard title="Решения и вендоры" hint={advisorBlockHints.solutions}>
                  <div className="solution-tags advisor-tags">
                    {selectedRow.solutions.map((solution) => (
                      <span key={solution}>{solution}</span>
                    ))}
                    {vendors.map((vendor) => (
                      <span key={vendor}>{vendor}</span>
                    ))}
                  </div>
                </AdvisorCard>
              </section>

              <section className="advisor-zone">
                <div className="advisor-zone-title">
                  <span>Чем подтвердить</span>
                  <p>Кейсы и материалы, которые усиливают доверие после первого разговора.</p>
                </div>
                <div className="advisor-grid">
                  <AdvisorCard title="Кейсы" hint={advisorBlockHints.cases}>
                    <div className="compact-list">
                      {recommendedCases.length ? (
                        recommendedCases.map((item) => (
                          <button type="button" key={item.id} onClick={() => setActiveCase(item)}>
                            <strong>{item.title}</strong>
                            <span>{item.result}</span>
                          </button>
                        ))
                      ) : (
                        <p className="muted-copy">Подходящие опубликованные кейсы пока не найдены.</p>
                      )}
                    </div>
                  </AdvisorCard>

                  <AdvisorCard title="Материалы" hint={advisorBlockHints.materials}>
                    <div className="advisor-links">
                      {recommendedMaterials.map((item) => (
                        <a key={item.id} href={assetHref(item.href)} download>
                          <Download size={15} />
                          <span>{item.title}</span>
                        </a>
                      ))}
                    </div>
                  </AdvisorCard>
                </div>
              </section>

              <section className="advisor-zone">
                <div className="advisor-zone-title">
                  <span>Кого подключить</span>
                  <p>Смежные роли, которые помогут подтвердить экономику, технологию и внедрение.</p>
                </div>
                <AdvisorCard title="Кого ещё подключить у заказчика" hint={advisorBlockHints.roles}>
                  <div className="compact-list advisor-role-list">
                    {connectedRoles.map(({ item, reason }) => (
                      <button type="button" key={item.role} onClick={() => chooseRole(item.role)}>
                        <strong>{item.role}</strong>
                        <span>{item.block}</span>
                        <em>{reason}</em>
                      </button>
                    ))}
                  </div>
                </AdvisorCard>
              </section>
            </>
          )}
        </div>
      </div>

      {activeCase && <CaseModal item={activeCase} materials={materials} onClose={() => setActiveCase(null)} />}
    </section>
  );
}

function AdvisorCard({ title, hint, children }) {
  return (
    <article className="advisor-card">
      <div className="advisor-card-head">
        <h3>{title}</h3>
        {hint && <FieldHint text={hint} />}
      </div>
      {children}
    </article>
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

function AdminPanel({ materials, cases, onMaterialsUpdate, onCasesUpdate }) {
  const [section, setSection] = useState('materials');

  return (
    <section className="page-shell">
      <PageTitle icon={Github} title="Админка" text="Публикуйте материалы и кейсы портала через GitHub." />
      <div className="admin-tabs">
        <button className={section === 'materials' ? 'active' : ''} onClick={() => setSection('materials')}>
          <BookOpen size={16} />
          Материалы
        </button>
        <button className={section === 'cases' ? 'active' : ''} onClick={() => setSection('cases')}>
          <BriefcaseBusiness size={16} />
          Кейсы
        </button>
      </div>
      {section === 'materials' && <AdminMaterials initialItems={materials} onLocalUpdate={onMaterialsUpdate} showTitle={false} />}
      {section === 'cases' && <AdminCases initialItems={cases} materials={materials} onLocalUpdate={onCasesUpdate} />}
    </section>
  );
}

function AdminMaterials({ initialItems, onLocalUpdate, showTitle = true }) {
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
      {showTitle && <PageTitle icon={Github} title="Админка материалов" text="Управляйте карточками материалов и публикуйте изменения в GitHub." />}
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
              <ControlWithHint hint={materialFieldHints.id}>
                <input value={form.id} onChange={(event) => updateField('id', event.target.value)} placeholder="material-id" />
              </ControlWithHint>
            </label>
            <label>
              Формат
              <ControlWithHint hint={materialFieldHints.format}>
                <select value={form.format} onChange={(event) => updateField('format', event.target.value)}>
                  {['PDF', 'PPTX', 'DOCX', 'XLSX', 'ZIP', 'LINK'].map((format) => (
                    <option key={format} value={format}>{format}</option>
                  ))}
                </select>
              </ControlWithHint>
            </label>
            <label>
              Название
              <ControlWithHint hint={materialFieldHints.title}>
                <input value={form.title} onChange={(event) => updateField('title', event.target.value)} />
              </ControlWithHint>
            </label>
            <label>
              Версия
              <ControlWithHint hint={materialFieldHints.version}>
                <input value={form.version} onChange={(event) => updateField('version', event.target.value)} />
              </ControlWithHint>
            </label>
            <label>
              Категория
              <ControlWithHint hint={materialFieldHints.category}>
                <select value={form.category} onChange={(event) => updateField('category', event.target.value)}>
                  <option value="">Выберите категорию</option>
                  {materialCategoryOptions.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </ControlWithHint>
            </label>
            <label>
              Теги через запятую
              <ControlWithHint hint={materialFieldHints.tagsText}>
                <input value={form.tagsText} onChange={(event) => updateField('tagsText', event.target.value)} />
              </ControlWithHint>
            </label>
            <label className="wide-field">
              Описание
              <ControlWithHint hint={materialFieldHints.description}>
                <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} rows={4} />
              </ControlWithHint>
            </label>
            <label className="wide-field">
              Ссылка на файл
              <ControlWithHint hint={materialFieldHints.href}>
                <input value={form.href} onChange={(event) => updateField('href', event.target.value)} placeholder="/assets/materials/file.pdf" />
              </ControlWithHint>
            </label>
            <div className="wide-field file-upload-row">
              <label className="file-field">
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
              <FieldHint text={materialFieldHints.file} />
            </div>
          </div>

          <div className="github-box">
            <label>
              GitHub token
              <ControlWithHint hint={materialFieldHints.token}>
                <input value={token} onChange={(event) => setToken(event.target.value)} type="password" placeholder="Fine-grained token: Contents read/write" />
              </ControlWithHint>
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

function AdminCases({ initialItems, materials, onLocalUpdate }) {
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState(() => emptyCase());
  const [selectedId, setSelectedId] = useState('');
  const [token, setToken] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(selectedId);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateIndustry(value) {
    setForm((current) => ({
      ...current,
      industry: value,
      subIndustry: '',
      segment: '',
    }));
  }

  function updateSubIndustry(value) {
    setForm((current) => ({
      ...current,
      subIndustry: value,
      segment: '',
    }));
  }

  function selectCase(item) {
    setSelectedId(item.id);
    setForm(caseToForm(item));
    setFile(null);
    setStatus({ type: '', text: '' });
  }

  function createCase() {
    setSelectedId('');
    setForm(emptyCase());
    setFile(null);
    setStatus({ type: '', text: '' });
  }

  function validate(item) {
    if (!item.id) return 'Заполните ID кейса.';
    if (!item.title) return 'Заполните название кейса.';
    if (!item.company) return 'Заполните анонимизированное описание заказчика.';
    if (!item.industry) return 'Заполните отрасль.';
    if (!item.solution) return 'Заполните решение.';
    if (!item.vendors.length) return 'Добавьте хотя бы одного вендора.';
    if (!item.result) return 'Заполните краткий результат.';
    return '';
  }

  function upsertLocal(event) {
    event.preventDefault();
    const item = normalizeCase(form);
    const error = validate(item);

    if (error) {
      setStatus({ type: 'error', text: error });
      return null;
    }

    const next = items.some((caseItem) => caseItem.id === selectedId || caseItem.id === item.id)
      ? items.map((caseItem) => (caseItem.id === selectedId || caseItem.id === item.id ? item : caseItem))
      : [...items, item];

    setItems(next);
    onLocalUpdate(next);
    setSelectedId(item.id);
    setStatus({ type: 'success', text: 'Кейс обновлён в текущем списке. Для публикации сохраните изменения в GitHub.' });
    return { item, next };
  }

  function removeCase(item) {
    const next = items.filter((caseItem) => caseItem.id !== item.id);
    setItems(next);
    onLocalUpdate(next);
    if (selectedId === item.id) createCase();
    setStatus({ type: 'success', text: 'Кейс удалён из текущего списка. Для публикации сохраните изменения в GitHub.' });
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

  async function publishToGithub() {
    if (!token.trim()) {
      setStatus({ type: 'error', text: 'Вставьте GitHub token с правом Contents: read/write.' });
      return;
    }

    setSaving(true);
    setStatus({ type: '', text: '' });

    try {
      let item = normalizeCase(form);
      let nextItems = items;
      const error = validate(item);

      if (!error) {
        if (file) {
          const fileName = slugifyFileName(file.name);
          const assetPath = `${githubConfig.caseAssetsPath}/${fileName}`;
          const assetSha = await getGithubSha(assetPath, token.trim());
          await putGithubFile(assetPath, await fileToBase64(file), `Upload case material ${fileName}`, assetSha);
          item = {
            ...item,
            attachments: [
              ...item.attachments,
              {
                title: file.name,
                href: `/assets/cases/${fileName}`,
                format: fileName.split('.').pop().toUpperCase(),
              },
            ],
          };
          setForm(caseToForm(item));
        }

        nextItems = items.some((caseItem) => caseItem.id === selectedId || caseItem.id === item.id)
          ? items.map((caseItem) => (caseItem.id === selectedId || caseItem.id === item.id ? item : caseItem))
          : [...items, item];
      }

      const casesSha = await getGithubSha(githubConfig.casesPath, token.trim());
      await putGithubFile(githubConfig.casesPath, encodeBase64(caseModuleSource(nextItems)), 'Update portal cases', casesSha);

      setItems(nextItems);
      onLocalUpdate(nextItems);
      setFile(null);
      setStatus({ type: 'success', text: 'Кейсы сохранены в GitHub. GitHub Pages обновится после завершения workflow.' });
    } catch (error) {
      setStatus({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  }

  const industryOptions = dictionaryValues('industry');
  const subIndustryOptions = form.industry ? dictionaryValues('subIndustry', { industry: form.industry }) : [];
  const segmentOptions = form.industry && form.subIndustry
    ? dictionaryValues('segment', { industry: form.industry, subIndustry: form.subIndustry })
    : [];

  return (
    <div className="admin-grid">
      <div className="admin-list">
        <div className="admin-toolbar">
          <strong>Кейсы</strong>
          <button onClick={createCase}>
            <Plus size={16} />
            Добавить
          </button>
        </div>
        {items.map((item) => (
          <button key={item.id} className={selectedId === item.id ? 'active' : ''} onClick={() => selectCase(item)}>
            <span>
              <strong>{item.title}</strong>
              <small>{item.status} · {(item.vendors || []).join(', ') || item.solution}</small>
            </span>
            <Pencil size={15} />
          </button>
        ))}
      </div>

      <form className="admin-editor" onSubmit={upsertLocal}>
        <div className="admin-editor-head">
          <div>
            <span>{isEditing ? 'Редактирование' : 'Новый кейс'}</span>
            <h3>{form.title || 'Карточка кейса'}</h3>
          </div>
          {isEditing && (
            <button type="button" className="danger-button" onClick={() => removeCase(items.find((item) => item.id === selectedId) || normalizeCase(form))}>
              <Trash2 size={16} />
              Удалить
            </button>
          )}
        </div>

        <div className="admin-form-grid">
          <label>
            ID
            <ControlWithHint hint={caseFieldHints.id}>
              <input value={form.id} onChange={(event) => updateField('id', event.target.value)} placeholder="case-id" />
            </ControlWithHint>
          </label>
          <label>
            Статус
            <ControlWithHint hint={caseFieldHints.status}>
              <select value={form.status} onChange={(event) => updateField('status', event.target.value)}>
                <option value="draft">Черновик</option>
                <option value="published">Опубликовано</option>
                <option value="hidden">Скрыто</option>
              </select>
            </ControlWithHint>
          </label>
          <label>
            Конфиденциальность
            <ControlWithHint hint={caseFieldHints.confidentiality}>
              <select value={form.confidentiality} onChange={(event) => updateField('confidentiality', event.target.value)}>
                <option value="public">Публичный</option>
                <option value="nda">Закрытый под NDA</option>
                <option value="anonymized">Анонимизированный</option>
              </select>
            </ControlWithHint>
          </label>
          <label>
            Анонимизация
            <ControlWithHint hint={caseFieldHints.isAnonymized}>
              <select value={form.isAnonymized ? 'yes' : 'no'} onChange={(event) => updateField('isAnonymized', event.target.value === 'yes')}>
                <option value="yes">Да</option>
                <option value="no">Нет</option>
              </select>
            </ControlWithHint>
          </label>
          <label className="wide-field">
            Название
            <ControlWithHint hint={caseFieldHints.title}>
              <input value={form.title} onChange={(event) => updateField('title', event.target.value)} />
            </ControlWithHint>
          </label>
          <label>
            Заказчик / обобщение
            <ControlWithHint hint={caseFieldHints.company}>
              <input value={form.company} onChange={(event) => updateField('company', event.target.value)} />
            </ControlWithHint>
          </label>
          <label>
            Регион
            <ControlWithHint hint={caseFieldHints.region}>
              <input value={form.region} onChange={(event) => updateField('region', event.target.value)} />
            </ControlWithHint>
          </label>
          <label>
            Отрасль
            <ControlWithHint hint={caseFieldHints.industry}>
              <select value={form.industry} onChange={(event) => updateIndustry(event.target.value)}>
                <option value="">Выберите отрасль</option>
                {industryOptions.map((industry) => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </ControlWithHint>
          </label>
          <label>
            Подотрасль
            <ControlWithHint hint={caseFieldHints.subIndustry}>
              <select value={form.subIndustry} onChange={(event) => updateSubIndustry(event.target.value)} disabled={!form.industry}>
                <option value="">Выберите подотрасль</option>
                {subIndustryOptions.map((subIndustry) => (
                  <option key={subIndustry} value={subIndustry}>{subIndustry}</option>
                ))}
              </select>
            </ControlWithHint>
          </label>
          <label>
            Сегмент
            <ControlWithHint hint={caseFieldHints.segment}>
              <select value={form.segment} onChange={(event) => updateField('segment', event.target.value)} disabled={!form.subIndustry}>
                <option value="">Выберите сегмент</option>
                {segmentOptions.map((segment) => (
                  <option key={segment} value={segment}>{segment}</option>
                ))}
              </select>
            </ControlWithHint>
          </label>
          <label>
            Масштаб
            <ControlWithHint hint={caseFieldHints.scale}>
              <input value={form.scale} onChange={(event) => updateField('scale', event.target.value)} />
            </ControlWithHint>
          </label>
          <label>
            Период
            <ControlWithHint hint={caseFieldHints.period}>
              <input value={form.period} onChange={(event) => updateField('period', event.target.value)} />
            </ControlWithHint>
          </label>
          <label>
            Решение
            <ControlWithHint hint={caseFieldHints.solution}>
              <input value={form.solution} onChange={(event) => updateField('solution', event.target.value)} />
            </ControlWithHint>
          </label>
          <label>
            Вендоры через запятую
            <ControlWithHint hint={caseFieldHints.vendorsText}>
              <input value={form.vendorsText} onChange={(event) => updateField('vendorsText', event.target.value)} />
            </ControlWithHint>
          </label>
          <label>
            Продукты через запятую
            <ControlWithHint hint={caseFieldHints.productsText}>
              <input value={form.productsText} onChange={(event) => updateField('productsText', event.target.value)} />
            </ControlWithHint>
          </label>
          <label>
            Теги через запятую
            <ControlWithHint hint={caseFieldHints.tagsText}>
              <input value={form.tagsText} onChange={(event) => updateField('tagsText', event.target.value)} />
            </ControlWithHint>
          </label>
          <label className="wide-field">
            Описание заказчика
            <ControlWithHint hint={caseFieldHints.customerDescription}>
              <textarea value={form.customerDescription} onChange={(event) => updateField('customerDescription', event.target.value)} rows={3} />
            </ControlWithHint>
          </label>
          <label className="wide-field">
            Краткое описание
            <ControlWithHint hint={caseFieldHints.summary}>
              <textarea value={form.summary} onChange={(event) => updateField('summary', event.target.value)} rows={3} />
            </ControlWithHint>
          </label>
          <label className="wide-field">
            Цели проекта
            <ControlWithHint hint={caseFieldHints.goalsText}>
              <textarea value={form.goalsText} onChange={(event) => updateField('goalsText', event.target.value)} rows={4} />
            </ControlWithHint>
          </label>
          <label className="wide-field">
            Проблема / ситуация до проекта
            <ControlWithHint hint={caseFieldHints.problemText}>
              <textarea value={form.problemText} onChange={(event) => updateField('problemText', event.target.value)} rows={5} />
            </ControlWithHint>
          </label>
          <label className="wide-field">
            Решение / реализация
            <ControlWithHint hint={caseFieldHints.implementationText}>
              <textarea value={form.implementationText} onChange={(event) => updateField('implementationText', event.target.value)} rows={5} />
            </ControlWithHint>
          </label>
          <label className="wide-field">
            Масштаб проекта
            <ControlWithHint hint={caseFieldHints.projectScaleText}>
              <textarea value={form.projectScaleText} onChange={(event) => updateField('projectScaleText', event.target.value)} rows={4} />
            </ControlWithHint>
          </label>
          <label className="wide-field">
            Результаты
            <ControlWithHint hint={caseFieldHints.resultsText}>
              <textarea value={form.resultsText} onChange={(event) => updateField('resultsText', event.target.value)} rows={5} />
            </ControlWithHint>
          </label>
          <label>
            Технологии через запятую
            <ControlWithHint hint={caseFieldHints.technologiesText}>
              <input value={form.technologiesText} onChange={(event) => updateField('technologiesText', event.target.value)} />
            </ControlWithHint>
          </label>
          <label>
            Масштаб реализации
            <ControlWithHint hint={caseFieldHints.realizationScale}>
              <input value={form.realizationScale} onChange={(event) => updateField('realizationScale', event.target.value)} />
            </ControlWithHint>
          </label>
          <label className="wide-field">
            Краткий результат для карточки
            <ControlWithHint hint={caseFieldHints.result}>
              <textarea value={form.result} onChange={(event) => updateField('result', event.target.value)} rows={2} />
            </ControlWithHint>
          </label>
          <label>
            Источник
            <ControlWithHint hint={caseFieldHints.sourceName}>
              <input value={form.sourceName} onChange={(event) => updateField('sourceName', event.target.value)} />
            </ControlWithHint>
          </label>
          <label>
            URL источника
            <ControlWithHint hint={caseFieldHints.sourceUrl}>
              <input value={form.sourceUrl} onChange={(event) => updateField('sourceUrl', event.target.value)} />
            </ControlWithHint>
          </label>
          <label className="wide-field">
            Связанные материалы: ID через запятую
            <ControlWithHint hint={caseFieldHints.relatedMaterialsText}>
              <input value={form.relatedMaterialsText} onChange={(event) => updateField('relatedMaterialsText', event.target.value)} list="material-ids" />
              <datalist id="material-ids">
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>{material.title}</option>
                ))}
              </datalist>
            </ControlWithHint>
          </label>
          <label className="wide-field">
            Приложения: название | ссылка | формат
            <ControlWithHint hint={caseFieldHints.attachmentsText}>
              <textarea value={form.attachmentsText} onChange={(event) => updateField('attachmentsText', event.target.value)} rows={3} />
            </ControlWithHint>
          </label>
          <div className="wide-field file-upload-row">
            <label className="file-field">
              <Upload size={18} />
              <span>{file ? file.name : 'Прикрепить PDF/XLSX/PPTX к кейсу'}</span>
              <input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            </label>
            <FieldHint text={caseFieldHints.file} />
          </div>
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
  );
}

function FieldHint({ text }) {
  return (
    <span className="field-hint">
      <button type="button" aria-label="Показать подсказку">
        <HelpCircle size={16} />
      </button>
      <span className="field-tooltip" role="tooltip">{text}</span>
    </span>
  );
}

function ControlWithHint({ hint, children }) {
  return (
    <span className="control-with-hint">
      {children}
      <FieldHint text={hint} />
    </span>
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

function CasesView({ options, filters, setFilters, cases: visibleCases, materials }) {
  const [activeCase, setActiveCase] = useState(null);
  const hasFilters = Object.values(filters).some(Boolean);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    setFilters({
      vendor: '',
      solution: '',
      industry: '',
      subIndustry: '',
      region: '',
      scale: '',
      period: '',
      tag: '',
    });
  }

  return (
    <section className="page-shell">
      <PageTitle icon={BriefcaseBusiness} title="Кейсы внедрений" text="Ищите проекты по вендору, отрасли, масштабу и результату внедрения." />
      <div className="case-filters">
        <Select label="Вендор" value={filters.vendor} onChange={(value) => updateFilter('vendor', value)} options={['', ...options.vendors]} />
        <Select label="Решение" value={filters.solution} onChange={(value) => updateFilter('solution', value)} options={['', ...options.solutions]} />
        <Select label="Отрасль" value={filters.industry} onChange={(value) => updateFilter('industry', value)} options={['', ...options.industries]} />
        <Select label="Подотрасль" value={filters.subIndustry} onChange={(value) => updateFilter('subIndustry', value)} options={['', ...options.subIndustries]} />
        <Select label="Регион" value={filters.region} onChange={(value) => updateFilter('region', value)} options={['', ...options.regions]} />
        <Select label="Масштаб" value={filters.scale} onChange={(value) => updateFilter('scale', value)} options={['', ...options.scales]} />
        <Select label="Период" value={filters.period} onChange={(value) => updateFilter('period', value)} options={['', ...options.periods]} />
        <Select label="Тег" value={filters.tag} onChange={(value) => updateFilter('tag', value)} options={['', ...options.tags]} />
        <button className="clear-button" onClick={clearFilters} disabled={!hasFilters}>
          <RotateCcw size={17} />
          Сбросить фильтры
        </button>
      </div>
      <div className="cases-list">
        {visibleCases.map((item) => (
          <button className="case-card" key={item.id} onClick={() => setActiveCase(item)}>
            <div className="case-icon">
              {(item.tags || []).includes('ИБ') ? <ShieldCheck size={24} /> : (item.tags || []).includes('WMS') ? <Building2 size={24} /> : <Factory size={24} />}
            </div>
            <div>
              <div className="tags">
                {[item.solution, ...(item.vendors || []), item.industry].filter(Boolean).map((tag) => (
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
            <ChevronRight size={18} />
          </button>
        ))}
        {!visibleCases.length && <div className="empty-state">Кейсы не найдены. Попробуйте изменить фильтры или поиск.</div>}
      </div>
      {activeCase && <CaseModal item={activeCase} materials={materials} onClose={() => setActiveCase(null)} />}
    </section>
  );
}

function CaseModal({ item, materials, onClose }) {
  const related = (item.relatedMaterials || [])
    .map((id) => materials.find((material) => material.id === id))
    .filter(Boolean);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <article className="case-modal" role="dialog" aria-modal="true" aria-label={item.title} onClick={(event) => event.stopPropagation()}>
        <div className="case-modal-head">
          <div>
            <span className="case-modal-kicker">Кейс</span>
            <h2>{item.title}</h2>
          </div>
          <button onClick={onClose} aria-label="Закрыть">
            <X size={22} />
          </button>
        </div>
        <div className="case-modal-body">
          <div className="tags">
            {[item.solution, item.industry, item.subIndustry, ...(item.vendors || [])].filter(Boolean).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <div className="case-lead">
            <h3>{item.company}</h3>
            <div className="case-meta">
              <span>{item.industry}</span>
              <span>{item.region}</span>
              <span>{item.period}</span>
              <span>{item.scale}</span>
            </div>
            {item.customerDescription && <p>{item.customerDescription}</p>}
            {item.isAnonymized && <div className="confidential-note">Кейс опубликован в анонимизированном виде</div>}
          </div>
          {item.summary && <CaseSection title="Краткое описание" items={[item.summary]} />}
          <CaseSection title="Проблема" items={item.problem} />
          <CaseSection title="Решение" items={item.implementation} />
          <CaseSection title="Масштаб проекта" items={item.projectScale} />
          <CaseSection title="Результаты" items={item.results} />
          {!!(item.vendors || []).length && (
            <section className="case-section vendor-section">
              <h3>Вендоры</h3>
              <div className="vendor-card">
                <strong>{item.vendors.join(', ')}</strong>
                {item.vendorNote && <span>{item.vendorNote}</span>}
                {item.sourceUrl && (
                  <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                    Смотреть публичный кейс
                  </a>
                )}
              </div>
            </section>
          )}
          {!!related.length && (
            <section className="case-section related-section">
              <h3>Связанные материалы</h3>
              {related.map((material) => (
                <a key={material.id} href={assetHref(material.href)} download>
                  <Download size={16} />
                  {material.title} ({material.format})
                </a>
              ))}
            </section>
          )}
          {!!(item.attachments || []).length && (
            <section className="case-section related-section">
              <h3>Приложения</h3>
              {item.attachments.map((attachment) => (
                <a key={`${attachment.title}-${attachment.href}`} href={attachment.href.startsWith('http') ? attachment.href : assetHref(attachment.href)} target="_blank" rel="noreferrer">
                  <Download size={16} />
                  {attachment.title} ({attachment.format})
                </a>
              ))}
            </section>
          )}
        </div>
      </article>
    </div>
  );
}

function CaseSection({ title, items }) {
  const visibleItems = (items || []).filter(Boolean);
  if (!visibleItems.length) return null;

  return (
    <section className="case-section">
      <h3>{title}</h3>
      <ul className="plain-list">
        {visibleItems.map((item) => (
          <li key={item}>
            <span>{item}</span>
          </li>
        ))}
      </ul>
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
