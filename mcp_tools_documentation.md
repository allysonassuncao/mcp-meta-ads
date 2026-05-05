# Meta Ads MCP - Documentação Detalhada das Ferramentas

Esta documentação detalha todas as 49 ferramentas e funcionalidades disponíveis neste MCP, divididas por categoria, informando a função de cada uma e seus parâmetros de uso.

## 📈 1. Campaigns (Gestão de Campanhas) - 15 Tools

Ferramentas responsáveis por todo o ciclo de vida da estrutura de campanhas (Campanha > Conjunto de Anúncios > Anúncio).

| Ferramenta | Descrição e Funcionalidade | Parâmetros Obrigatórios | Parâmetros Opcionais |
| :--- | :--- | :--- | :--- |
| **`list_campaigns`** | Lista as campanhas de uma conta com paginação e filtros. | `account_id` | `status`, `limit`, `after` |
| **`create_campaign`** | Cria uma nova campanha configurando objetivo e orçamento. | `account_id`, `name`, `objective` | `status`, `daily_budget`, `lifetime_budget`, `start_time`, `stop_time`, `special_ad_categories`, `bid_strategy`, `bid_cap`, `budget_optimization` |
| **`update_campaign`** | Altera dados de uma campanha existente. | `campaign_id` | `name`, `status`, `daily_budget`, `lifetime_budget`, `start_time`, `stop_time` |
| **`pause_campaign`** | Pausa uma campanha ativa. | `campaign_id` | - |
| **`resume_campaign`** | Reativa uma campanha pausada. | `campaign_id` | - |
| **`delete_campaign`** | Deleta (arquiva) permanentemente uma campanha. | `campaign_id` | - |
| **`get_campaign`** | Busca os detalhes completos de uma campanha. | `campaign_id` | - |
| **`list_ad_sets`** | Lista todos os conjuntos de anúncios. | - | `campaign_id`, `account_id`, `status`, `limit`, `after` |
| **`list_campaign_ad_sets`** | Busca detalhada de ad sets de uma campanha. | `campaign_id` | `limit` |
| **`create_ad_set_enhanced`** | Criação avançada de conjuntos de anúncios com segmentação e otimização. | `campaign_id`, `name`, `optimization_goal`, `billing_event` | `daily_budget`, `lifetime_budget`, `bid_amount`, `start_time`, `end_time`, `targeting`, `promoted_object`, `attribution_spec` |
| **`list_ads`** | Lista anúncios (Ads) finais. | - | `adset_id`, `campaign_id`, `account_id`, `limit` |
| **`check_campaign_readiness`** | Diagnóstico pré-lançamento de uma campanha. | `campaign_id` | - |
| **`get_meta_api_reference`** | Consulta documentação interna da API. | - | `topic` |
| **`get_quick_fixes`** | Sistema de troubleshooting para erros da API da Meta. | `error_message` | - |
| **`verify_account_setup`** | Verifica a saúde geral da conta (permissões, pagamentos). | `account_id` | - |

---

## 📊 2. Analytics (Métricas e Relatórios) - 5 Tools

Ferramentas para extrair dados de performance, analisar ROAS e comparar resultados.

| Ferramenta | Descrição e Funcionalidade | Parâmetros Obrigatórios | Parâmetros Opcionais |
| :--- | :--- | :--- | :--- |
| **`get_insights`** | Busca métricas detalhadas (impressões, conversões, ROAS, etc). | `object_id`, `level` | `date_preset`, `time_range`, `fields`, `breakdowns`, `limit` |
| **`compare_performance`** | Compara múltiplos objetos (campanhas/anúncios) lado a lado. | `object_ids`, `level` | `date_preset`, `time_range`, `metrics` |
| **`get_campaign_performance`** | Visão analítica focada em uma única campanha. | `campaign_id` | `date_preset` |
| **`get_attribution_data`** | Busca dados específicos de janelas de atribuição. | `object_id` | `date_preset` |
| **`export_insights`** | Gera e formata dados para exportação em CSV/JSON. | `object_id`, `level` | `format`, `date_preset`, `time_range`, `fields`, `breakdowns` |

---

## 👥 3. Audiences (Gestão de Públicos) - 7 Tools

Ferramentas para criar e gerenciar a segmentação.

| Ferramenta | Descrição e Funcionalidade | Parâmetros Obrigatórios | Parâmetros Opcionais |
| :--- | :--- | :--- | :--- |
| **`list_audiences`** | Lista os públicos existentes na conta. | `account_id` | `type`, `limit`, `after` |
| **`create_custom_audience`** | Cria novos públicos personalizados. | `account_id`, `name`, `subtype` | `description`, `customer_file_source`, `retention_days`, `rule` |
| **`create_lookalike_audience`** | Gera públicos semelhantes (Lookalike). | `account_id`, `name`, `origin_audience_id`, `country`, `ratio` | `description` |
| **`estimate_audience_size`** | Simula o tamanho de um público baseado na segmentação. | `account_id`, `targeting`, `optimization_goal` | - |
| **`update_custom_audience`** | Modifica regras de um público existente. | `audience_id` | `name`, `description`, `rule` |
| **`get_audience_insights`** | Retorna status de saúde e detalhes do público. | `audience_id` | - |
| **`delete_audience`** | Remove um público da conta. | `audience_id` | - |

---

## 🎨 4. Creatives (Gestão de Criativos) - 16 Tools

Ferramentas completas para lidar com anúncios (textos, imagens e vídeos).

| Ferramenta | Descrição e Funcionalidade | Parâmetros Obrigatórios | Parâmetros Opcionais |
| :--- | :--- | :--- | :--- |
| **`list_creatives`** | Lista todos os criativos da biblioteca da conta. | `account_id` | `limit`, `after` |
| **`create_ad_creative`** | Cria um criativo combinando texto, título, imagem e CTA. | `account_id`, `name`, `page_id`, `message`, `link_url` | `headline`, `picture`, `image_hash`, `video_id`, `call_to_action_type`, `description`, `instagram_actor_id`, `adlabels`, `enhancement_features` |
| **`validate_creative_setup`** | Analisa se as combinações do criativo são válidas antes do envio. | `account_id`, `name`, `page_id`, `message`, `link_url` | (Idem create_ad_creative) |
| **`validate_creative_enhanced`** | Validação avançada para as regras v23.0 da API. | `account_id`, `name`, `page_id`, `message`, `link_url` | (Idem create_ad_creative) |
| **`preview_ad`** | Gera uma URL temporária de preview do anúncio no feed/stories. | `creative_id`, `ad_format` | `product_item_ids` |
| **`upload_creative_asset`** | Uploads diretos de mídias locais para a biblioteca. | `account_id`, `file_path` | - |
| **`upload_image_from_url`** | Baixa uma imagem via URL e a envia para a biblioteca da Meta. | `account_id`, `image_url` | `image_name` |
| **`setup_ab_test`** | Ajuda a estruturar criativos para testes A/B. | `account_id`, `adset_id`, `creatives` | - |
| **`get_creative_performance`** | Puxa métricas de performance do criativo. | `creative_id` | `date_preset` |
| **`get_creative_best_practices`** | Base de conhecimento de melhores práticas de conversão. | - | `format` |
| **`analyze_account_creatives`** | Analisa criativos em lote e encontra padrões de sucesso. | `account_id` | `limit` |
| **`troubleshoot_creative_issues`** | Diagnostica erros e rejeições em imagens/links. | `issue_description` | `creative_type` |
| **`update_creative`** | Altera dados em um criativo existente. | `creative_id` | Parâmetros textuais e mídias |
| **`delete_creative`** | Deleta o criativo da biblioteca. | `creative_id` | - |
| **`check_api_v23_compliance`** | Auditoria específica para regras modernas da API v23.0. | `creative_id` | - |
| **`get_meta_error_codes`** | Dicionário de códigos de erro específicos da Meta. | - | `error_code`, `error_subcode` |

---

## ⚙️ 5. Utils (Sistema e Diagnóstico) - 3 Tools

Ferramentas auxiliares para o MCP.

| Ferramenta | Descrição e Funcionalidade | Parâmetros Obrigatórios | Parâmetros Opcionais |
| :--- | :--- | :--- | :--- |
| **`get_ad_accounts`** | Lista todas as contas de anúncios permitidas pelo token. | - | - |
| **`health_check`** | Verifica conexão, rate limits e integridade da API. | - | - |
| **`get_ai_guidance`** | Retorna fluxos, tutoriais e dicas de otimização. | - | - |

---

## 🔒 6. OAuth (Autenticação) - 6 Tools

Gerenciamento de tokens e acesso à conta.

| Ferramenta | Descrição e Funcionalidade | Parâmetros Obrigatórios | Parâmetros Opcionais |
| :--- | :--- | :--- | :--- |
| **`generate_auth_url`** | Gera o link de login do Facebook. | - | `scopes`, `state` |
| **`exchange_code_for_token`** | Troca código de login por token de acesso curto. | `code` | - |
| **`refresh_to_long_lived_token`** | Converte token curto em token de longa duração (~60 dias). | - | `short_lived_token` |
| **`generate_system_user_token`** | Gera um token de automação (System User). | `system_user_id` | `scopes`, `expiring_token` |
| **`get_token_info`** | Verifica permissões, ID e validade do token atual. | - | - |
| **`validate_token`** | Testa ativamente se o token é aceito pela Meta. | - | - |
