# Дерево коллекций ITMen Pipeline (schema v2)

Импорт: `python3 /opt/itmen-pipeline/scripts/recreate-collections.py`  
JSON: `/opt/itmen-pipeline/pb_schema/collections.import.json`

```
itmen_pipeline
│
├── deals                         # 218 сделок
│   ├── deal_id                   text UNIQUE     ← id (D-001)
│   ├── customer, industry, owner, stage, deal_type
│   ├── amount, expected_budget, partner, partner_discount, client_discount
│   ├── manual_prob, task_due, budget_period, budget_status
│   ├── budget_planned_month, budget_planned_year
│   ├── pains                     editor
│   ├── capabilities, dml
│   ├── next_step_type, next_step_comment
│   ├── risk_type, risk_types     json, risk_comment
│   ├── commit_status, last_update, amo_id
│   ├── has_pains                 bool            ← lite-флаг GAS
│   ├── competitors               text            ← legacy поле
│   ├── deal_updated_at           date            ← updatedAt
│   ├── tech_research             json            seekingSegments, competitorEntries…
│   ├── scores, score_reasons, score_history, scores_overridden
│   └── payload                   json            ★ полный оригинал сделки
│
├── pipeline_meta                 # 1 запись slug=main
│   ├── slug                      text UNIQUE
│   ├── next_id, data_epoch
│   ├── lists                     json            stages, owners, partners…
│   ├── scoring                   json            модель скоринга
│   ├── pipeline_focus            json            title, goal, risk, nextStep
│   ├── saved_at, saved_by
│   └── state_payload             json            ★ прочие поля state
│
├── managers                      # 4 менеджера (MANAGERS из GAS)
│   ├── manager_id                text UNIQUE
│   ├── name, sheet, active
│
├── audit_log                     # ~7615 строк _audit
│   ├── at, saved_by, deal_id, customer, owner
│   ├── change_count, label
│   ├── old_value, new_value      editor
│   └── is_new_deal               bool
│
├── snapshots_daily               # _snapshots_daily
│   ├── date, ts, source
│   └── deal_count, total_pipeline, weighted_pipeline, hot/warm, avg_score
│
├── snapshots_deals               # _snapshots_deals
│   └── date, ts, deal_id, customer, owner, score, amount, category
│
└── import_log                    # журнал импортов
    └── source, started_at, finished_at, status, counts, notes, error
```

## Гарантия без потерь

| Уровень | Механизм |
|---------|----------|
| Сделки | `deals.payload` = полный JSON из GAS + все поля отдельно |
| Мета | `pipeline_meta.state_payload` = `{nextId, scoring, pipelineFocus, _savedAt…}` |
| Аудит | все 9 колонок + `is_new_deal` для строк «Новая сделка» |
| Снапшоты | отдельные коллекции под оба листа GAS |

## Маппинг GAS → PB

| GAS | PocketBase |
|-----|------------|
| `deals[].id` | `deal_id` |
| `deals[].updatedAt` | `deal_updated_at` |
| `deals[].dealType` | `deal_type` |
| `deals[].techResearch` | `tech_research` |
| `lists` | `pipeline_meta.lists` |
| `scoring` | `pipeline_meta.scoring` |
| `pipelineFocus` | `pipeline_meta.pipeline_focus` |
| `nextId` | `pipeline_meta.next_id` |
| `MANAGERS[]` | `managers` |
