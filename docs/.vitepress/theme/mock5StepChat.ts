/**
 * Vite plugin: dev-time mock 5-step SSE streaming chat endpoint.
 *
 * Intercepts POST requests to /api/5step-chat and responds with SSE that
 * simulates the complete 5-step transparent execution flow defined in
 * BEBISO-Chatbot-5Step-API-Spec.md.
 *
 * Usage: add `import './mock5StepChat';` in docs/.vitepress/config.mts`
 * or theme/index.ts (dev mode only).
 */
export function mock5StepChat() {
  return {
    name: 'vitepress-plugin-mock-5step-chat',

    configureServer(server: any) {
      server.middlewares.use('/api/5step-chat', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no')

        const send = (event: string, data: object) => {
          res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        }

        const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

        let userMessage = ''
        try {
          const body = await readBody(req)
          const parsed = JSON.parse(body)
          if (typeof parsed.message === 'string' && parsed.message.trim()) {
            userMessage = parsed.message.trim()
          } else if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
            for (let i = parsed.messages.length - 1; i >= 0; i--) {
              const msg = parsed.messages[i]
              if (msg.role === 'user' && typeof msg.content === 'string' && msg.content.trim()) {
                userMessage = msg.content.trim()
                break
              }
            }
          }
        } catch {}

        // ─── Simulate 5-step execution ────────────────────────────────

        // Step 1: Intent Recognition
        send('step_update', {
          step: 1,
          stepName: '意图识别',
          status: 'active',
          summary: '正在识别用户意图...',
        })
        await delay(600)

        send('step_update', {
          step: 1,
          stepName: '意图识别',
          status: 'completed',
          summary: '识别为查询未执行采购需求',
          details: {
            intent: 'query_unexecuted_purchase_requests',
            intentLabel: '查询未执行采购需求',
            objectTerm: '采购需求',
            operationType: 'query',
            riskLevel: 'low',
            requiresConfirmation: false,
          },
        })
        await delay(400)

        // Step 2: Ontology Object Location
        send('step_update', {
          step: 2,
          stepName: '本体对象定位',
          status: 'active',
          summary: '正在查询本体知识图谱...',
        })
        await delay(700)

        send('step_update', {
          step: 2,
          stepName: '本体对象定位',
          status: 'completed',
          summary: '命中采购需求对象',
          details: {
            objectType: 'purchase_request',
            objectLabel: '采购需求',
            hitKeywords: ['采购需求', '采购计划', '物料需求'],
            attributes: [
              { key: 'status', label: '执行状态', usage: 'filter' },
              { key: 'delete_flag', label: '删除标记', usage: 'filter' },
              { key: 'source_type', label: '来源类型', usage: 'display' },
              { key: 'apply_dep', label: '申请部门', usage: 'display' },
              { key: 'material_id', label: '物料编码', usage: 'display' },
              { key: 'quantity', label: '需求数量', usage: 'display' },
            ],
            availableActions: ['查询', '展示', '状态判断'],
            ontologyCompleteness: 'partial',
            gaps: [
              {
                gapType: 'missing_attribute',
                description: '缺少 source_type 字段映射',
                suggestion: '在采购需求对象中补充来源类型字段',
              },
            ],
          },
        })
        await delay(400)

        // Step 3: Task Planning
        send('step_update', {
          step: 3,
          stepName: '任务规划',
          status: 'active',
          summary: '正在生成处理计划...',
        })
        await delay(500)

        send('step_update', {
          step: 3,
          stepName: '任务规划',
          status: 'completed',
          summary: '计划查询未执行且未删除采购需求',
          details: {
            plannedActions: [
              { sequence: 1, actionId: 'purchase_request/list', actionLabel: '查询采购需求', description: '从采购系统查询所有采购需求' },
              { sequence: 2, actionId: 'filter/unexecuted', actionLabel: '筛选未执行', description: '排除已执行、已删除记录' },
              { sequence: 3, actionId: 'aggregate/source', actionLabel: '统计来源分布', description: '按来源类型聚合数量' },
              { sequence: 4, actionId: 'format/response', actionLabel: '格式化返回', description: '生成摘要和明细' },
            ],
            queryConditions: [
              { field: 'delete_flag', operator: '!=', value: 1, label: '未删除' },
              { field: 'status', operator: '=', value: '未执行', label: '状态为未执行' },
            ],
            aggregationRules: [
              { type: 'count', fields: ['source_type'], label: '按来源统计数量' },
            ],
            displayFields: ['编号', '物料', '数量', '部门', '申请人', '需求日期', '来源'],
            riskLevel: 'low',
            requiresConfirmation: false,
          },
        })
        await delay(400)

        // Step 4: Execution
        send('step_update', {
          step: 4,
          stepName: '执行过程',
          status: 'active',
          summary: '正在调用采购系统...',
          connector: {
            name: 'ProcurementSystemConnector',
            id: 'procurement-connector-v1',
            status: 'pending',
          },
        })
        await delay(800)

        send('step_update', {
          step: 4,
          stepName: '执行过程',
          status: 'active',
          summary: '正在调用采购系统...',
          connector: {
            name: 'ProcurementSystemConnector',
            id: 'procurement-connector-v1',
            status: 'running',
          },
          details: {
            executions: [
              {
                connectorName: 'ProcurementSystemConnector',
                connectorId: 'procurement-connector-v1',
                actionId: 'purchase_request/list',
                status: 'running',
                requestParams: { delete_flag: '!=1', status: '未执行' },
              },
            ],
          },
        })
        await delay(1000)

        send('step_update', {
          step: 4,
          stepName: '执行过程',
          status: 'completed',
          summary: '查询完成，共返回 5 条记录',
          connector: {
            name: 'ProcurementSystemConnector',
            id: 'procurement-connector-v1',
            status: 'success',
            resultSummary: '查询成功',
            resultCount: 5,
            latencyMs: 1247,
          },
          details: {
            executions: [
              {
                connectorName: 'ProcurementSystemConnector',
                connectorId: 'procurement-connector-v1',
                actionId: 'purchase_request/list',
                status: 'success',
                startTime: new Date(Date.now() - 2247).toISOString(),
                endTime: new Date().toISOString(),
                latencyMs: 1247,
                requestParams: { delete_flag: '!=1', status: '未执行' },
                responseSummary: '查询成功',
                resultCount: 5,
              },
            ],
          },
        })
        await delay(300)

        // Step 5: Generate Response
        send('step_update', {
          step: 5,
          stepName: '生成回复',
          status: 'active',
          summary: '正在生成结果摘要...',
        })
        await delay(500)

        const sourceDist = JSON.stringify({ '系统接口集成': 3, '手工创建': 2, '批量导入': 0 })
        send('step_update', {
          step: 5,
          stepName: '生成回复',
          status: 'completed',
          summary: '已生成结果摘要和下一步建议',
          suggestedActions: [
            { id: 'show_detail', label: '展示明细', type: 'navigate' },
            { id: 'aggregate_dept', label: '按部门汇总', type: 'execute' },
            { id: 'filter_type', label: '按采购类型筛选', type: 'execute' },
            { id: 'create_inquiry', label: '生成询价单', type: 'execute' },
            { id: 'export', label: '导出清单', type: 'export' },
          ],
          details: {
            resultSummary: '已查询到 5 条未执行采购需求',
            statistics: [
              { label: '总数量', value: 5, unit: '条' },
              { label: '系统接口集成', value: 3, unit: '条' },
              { label: '手工创建', value: 2, unit: '条' },
            ],
            resultDefinition: '未执行：当前状态为未执行；已删除记录已排除',
            nextActions: [],
          },
        })

        // Stream final content response
        const contentChunks = [
          '已查询到 ',
          '**5 条**',
          ' 未执行采购需求。\n\n',
          '来源分布：\n\n',
          '- **系统接口集成**：3 条\n',
          '- **手工创建**：2 条\n',
          '- **批量导入**：0 条\n\n',
          '---\n\n',
          '需要我为您展示详细列表吗？',
        ]

        for (const chunk of contentChunks) {
          send('content', { content: chunk })
          await delay(30 + Math.random() * 50)
        }

        // Interaction choice: "需要我为您展示详细列表吗？"
        await delay(200)
        send('interaction', {
          id: 'interaction-001',
          title: '请选择后续操作',
          description: '已查询到 5 条未执行采购需求，您希望如何继续？',
          type: 'choice',
          required: false,
          options: [
            { id: 'show_detail', label: '展示明细列表', icon: 'list', action: 'navigate', description: '查看每条采购需求的完整信息', recommended: true },
            { id: 'aggregate_dept', label: '按部门汇总', icon: 'chart', action: 'execute', description: '按申请部门统计数量分布' },
            { id: 'filter_type', label: '按采购类型筛选', icon: 'filter', action: 'execute', description: '按来源类型进一步筛选' },
            { id: 'create_inquiry', label: '生成询价单', icon: 'compose', action: 'execute', description: '为选中的采购需求生成询价单' },
            { id: 'export', label: '导出清单', icon: 'export', action: 'export', description: '导出为 Excel 或 CSV 格式' },
          ],
        })

        await delay(200)
        send('done', { taskId: `TASK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`, finalStep: 5, durationMs: 5000 })
        res.end()
      })
    },
  }
}

function readBody(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk: Buffer) => (body += chunk.toString()))
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}
