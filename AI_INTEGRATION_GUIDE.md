# Meta Ads MCP - Guia de Integração para Agentes de IA

Este documento é o guia definitivo de integração para **Agentes de Inteligência Artificial** e **Aplicações Cliente** que desejam consumir o Meta Ads MCP Server. 

O servidor atua como uma ponte segura e tipada entre modelos de linguagem (LLMs) e a API Oficial de Marketing da Meta.

---

## 1. Regras de Ouro e Requisitos (Golden Rules)

1. **Autenticação Pass-Through**: O MCP não armazena chaves hardcoded da Meta. Toda requisição **deve** conter o Token de Acesso do usuário final no cabeçalho `Authorization: Bearer <TOKEN>`.
2. **Identificador de Conta**: Quase todas as ferramentas exigem um ID de conta de anúncios. O MCP aceita as chaves `account_id` ou `ad_account_id`. Se o usuário não souber o ID, o agente **deve** primeiro chamar a ferramenta `get_ad_accounts`.
3. **Formatação do ID da Conta**: A API da Meta exige o prefixo `act_` antes dos números da conta (ex: `act_1234567890`). O MCP injeta isso automaticamente caso o agente esqueça, mas a boa prática é enviar o prefixo.
4. **Resoluções de Erro**: Se a API retornar erro de "decryption" (código 190), o MCP já tenta um fallback automático removendo o `appsecret_proof`.

---

## 2. Modos de Conexão

O servidor foi arquitetado para suportar duas formas de comunicação HTTP, garantindo compatibilidade máxima com diferentes ecossistemas.

### Modo A: MCP Padrão (SSE - Server-Sent Events)
Ideal para clientes nativos MCP (como Claude Desktop).
- O cliente deve enviar o cabeçalho `Accept: text/event-stream`.
- A conexão é iniciada via `GET /api/mcp` e mantida aberta.
- Comandos são enviados via `POST` para o endpoint fornecido na abertura da sessão.

### Modo B: REST Simplificado (Modo Postman / Chat IA)
Ideal para integrações rápidas em aplicações web sem suporte nativo a fluxos contínuos.
- **Requisição:** `POST /api/mcp`
- **Condição Obrigatória:** O cabeçalho `Accept` **NÃO DEVE** conter `text/event-stream`.
- O servidor processa a chamada JSON-RPC sincronicamente e devolve a resposta imediata.

**Exemplo de Requisição REST:**
```json
// Headers:
// Authorization: Bearer EAAK...
// Content-Type: application/json

// Body:
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "list_campaigns",
    "arguments": {
      "account_id": "act_1234567890",
      "limit": 10
    }
  },
  "id": 1
}
```

---

## 3. Catálogo de Ferramentas (Tools)

O MCP expõe diversas ferramentas. Aqui está a referência para os agentes de IA orquestrarem fluxos de trabalho.

### A. Descoberta
*   **`get_ad_accounts`**
    *   *Descrição:* Lista todas as contas de anúncios vinculadas ao token fornecido.
    *   *Parâmetros:* Nenhum.

### B. Gestão de Campanhas
*   **`list_campaigns`**
    *   *Descrição:* Lista campanhas de uma conta com filtros de status e paginação.
    *   *Parâmetros:* `account_id` (string, obrigatório), `status` (string opcional, ex: "ACTIVE", "PAUSED"), `limit` (number).
*   **`create_campaign`**
    *   *Descrição:* Cria uma nova campanha na Meta.
    *   *Parâmetros Principais:* `account_id` (obrigatório), `name` (obrigatório), `objective` (obrigatório, ex: "OUTCOME_SALES", "OUTCOME_LEADS"), `daily_budget` ou `lifetime_budget` (apenas um dos dois).
*   **`update_campaign`**
    *   *Descrição:* Atualiza campos específicos (nome, orçamento, status) de uma campanha.
    *   *Parâmetros:* `campaign_id` (obrigatório), e os campos a atualizar (ex: `daily_budget`).
*   **`pause_campaign` / `resume_campaign` / `delete_campaign`**
    *   *Descrição:* Ações rápidas de estado.
    *   *Parâmetros:* Apenas `campaign_id` (obrigatório).

### C. Gestão de Conjunto de Anúncios (Ad Sets)
*   **`list_ad_sets`**
    *   *Descrição:* Lista conjuntos de anúncios.
    *   *Parâmetros:* Pelo menos `campaign_id` OU `account_id` é obrigatório.
*   **`create_ad_set`**
    *   *Descrição:* Cria o "targeting" (público, orçamento, posicionamento).
    *   *Parâmetros Principais:* `campaign_id` (obrigatório), `name`, `optimization_goal`, `billing_event`, `targeting` (objeto complexo contendo `geo_locations`, `age_min`, `interests`, etc).

### D. Gestão de Anúncios e Criativos
*   **`list_creatives`**
    *   *Descrição:* Lista os criativos da conta.
    *   *Parâmetros:* `account_id` (obrigatório), `limit`.
*   **`create_ad_creative`**
    *   *Descrição:* Cria o conteúdo visual e textual.
    *   *Parâmetros:* `account_id`, `name`, `page_id` (página do FB), `message`, `link_url`, etc.

### E. Analytics e Insights
*   **`get_insights`**
    *   *Descrição:* Busca métricas de performance (impressões, cliques, gasto).
    *   *Parâmetros Principais:* `object_id` (Pode ser ID da conta, campanha ou ad_set), `level` ("account", "campaign", "adset", "ad"), `date_preset` (ex: "last_30d") ou `time_range`.
*   **`compare_performance`**
    *   *Descrição:* Compara múltiplos IDs para análise de A/B.
    *   *Parâmetros:* `object_ids` (array de strings).

### F. Gestão de Público (Audiences)
*   **`list_audiences`**
    *   *Descrição:* Lista públicos salvos.
*   **`create_custom_audience` / `create_lookalike_audience`**
    *   *Descrição:* Cria públicos personalizados baseados em regras ou públicos semelhantes (Lookalike) a partir de um público origem (`origin_audience_id`).
*   **`estimate_audience_size`**
    *   *Descrição:* Antes de criar um ad set, simula qual o tamanho do público para os parâmetros de targeting escolhidos.

---

## 4. Exemplos de Fluxos de Trabalho para o Agente de IA

Para auxiliar o usuário humano, o agente de IA deve seguir estes passos lógicos:

**Cenário: "Quero criar uma campanha de vendas"**
1. O agente executa `get_ad_accounts` para saber o ID da conta.
2. O agente executa `create_campaign` definindo o `objective` como `"OUTCOME_SALES"`.
3. O agente executa `create_ad_set` informando o ID da campanha gerada no passo anterior e definindo o público alvo (`targeting`).
4. (Se solicitado) O agente executa `create_ad_creative` e vincula ao conjunto.

**Cenário: "Como estão minhas campanhas ativas?"**
1. O agente executa `list_campaigns` com `"status": "ACTIVE"`.
2. Para cada campanha retornada, o agente pode executar `get_insights` definindo `"level": "campaign"` e `"date_preset": "last_7d"` para entregar um relatório de ROI e CTR ao usuário.

---
*Fim da Documentação.*
