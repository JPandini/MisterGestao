# TODO — divisão do MisterGestão

Este documento acompanha a divisão combinada por Pandini, Ferrari e Danner. É planejamento, não uma ordem para executar tudo.
Marque cada item conforme a implementação e as verificações realizadas; validação no aparelho deve ser registrada separadamente.

## Guias

- [Guia geral do projeto](GUIA_CODEX_MISTERGESTAO.md)
- [Pandini — integração e fluxos principais](Pandini.md)
- [Danner — Home e Produtos](GUIA_DANNER.md)
- [Ferrari — Login visual, Cadastro e Orçamentos salvos](GUIA_FERRARI.md)

O guia geral foi copiado do material enviado por Pandini e preserva o contexto original. Referências a um pacote de protótipo não significam que esses arquivos estejam disponíveis em docs/. A divisão de equipe está neste TODO e nos guias individuais.

## Divisão das telas

| Tela | Responsável | Escopo | Situação conhecida |
| --- | --- | --- | --- |
| Login | Ferrari → Pandini | Ferrari: visual/validações. Pandini: autenticação, sessão e navegação. | Visual iniciado por Ferrari; Pandini ligou Entrar à Home, sem validação. Autenticação e sessão pendentes. |
| Home | Danner | Refatoração, resumo, estoque baixo e atalhos. | Iniciada; precisa de refatoração e integração. |
| Produtos | Danner | Lista, pesquisa, preço, estoque e seleção para o carrinho. | A fazer. |
| Cadastro de produto | Ferrari | Formulário, validações e integração com função comum de salvar. | Arquivo inicial existente; implementação pendente. |
| Orçamentos salvos | Ferrari | Lista, status, estado vazio e abertura do detalhe pelo ID. | A fazer. |
| Carrinho | Pandini | Itens, quantidades, cliente, desconto, frete, validade e totais. | A fazer. |
| Detalhe do orçamento | Pandini | Gerar/salvar, visualizar, compartilhar, aprovar, cancelar e converter. | A fazer. |
| Nova venda | Pandini | Venda direta e revisão da conversão de orçamento. | A fazer. |
| Finalizar venda | Pandini | Entrega/retirada, pagamento, confirmação e baixa de estoque. | A fazer. |
| Recibo | Pandini | Consulta e compartilhamento da venda registrada. | A fazer. |
| Scanner | Pandini | Permissão, leitura de código e alternativa manual. | Etapa posterior ao fluxo manual. |

## Decisões pendentes — Pandini

- [x] Definir a primeira etapa: Login apenas navega para Home, sem validar campos ou credenciais.
- [ ] Decidir o modelo de autenticação da próxima etapa; Firebase ainda não foi instalado/configurado.
- [ ] Confirmar menu inferior proposto: Home, Produtos, Orçamentos e Venda.
- [ ] Combinar quando Ferrari entrega Login.js para Pandini assumir a integração.
- [ ] Definir os campos/funções comuns necessários às primeiras telas.
- [ ] Conferir imagens referenciadas pelo app.json e combinar a correção mínima se faltarem.

## Pandini — base comum e telas principais

- [x] Implementar navegação inicial Login → Home com Expo Router (lint e TypeScript passaram).
- [ ] Validar no celular: abrir o app, tocar em Entrar com campos vazios e conferir a Home.
- [ ] Ampliar a navegação conforme as próximas telas, incluindo o menu quando aprovado.
- [ ] Implementar sessão e controle de acesso às telas internas.
- [ ] Integrar o Login após a entrega de Ferrari.
- [ ] Disponibilizar produtos comuns e operações usadas pelas telas dos colegas.
- [ ] Disponibilizar carrinho único e suas operações.
- [ ] Implementar Carrinho e sua rota.
- [ ] Implementar salvamento e detalhe do orçamento por ID.
- [ ] Implementar compartilhamento inicial em texto.
- [ ] Integrar consulta de orçamentos para a lista de Ferrari.
- [ ] Validar o primeiro fluxo completo de orçamento com o time.
- [ ] Implementar Nova venda e conversão de orçamento.
- [ ] Implementar Finalizar venda com estoque e proteção contra duplicidade.
- [ ] Implementar Recibo com os dados da venda salva.
- [ ] Implementar Scanner após o fluxo manual aprovado.
- [ ] Planejar persistência local, compartilhamento em imagem e banco em incrementos separados.
- [ ] Revisar as entregas e coordenar a integração das branches.

## Danner — branch danner

- [ ] Refatorar Home.js preservando o visual aprovado e simplificando o código.
- [ ] Ajustar alertas de estoque para stock <= minimum.
- [ ] Preparar os atalhos combinados, distinguindo ações pendentes de ações funcionando.
- [ ] Integrar Home aos dados comuns disponibilizados por Pandini.
- [ ] Criar Produtos com pesquisa por nome/medida e estado vazio.
- [ ] Integrar adição e contador ao carrinho único.
- [ ] Ligar acessos ao cadastro e carrinho quando as rotas existirem.
- [ ] Validar os fluxos e entregar para revisão de Pandini.

## Ferrari — branch ferrari

- [ ] Concluir visual de Login.js; validações ficam para uma etapa futura combinada com Pandini.
- [ ] Incluir mostrar/ocultar senha e conferir uso com teclado aberto.
- [ ] Alinhar melhorias do Login com Pandini, preservando a navegação direta já implementada.
- [ ] Implementar CadastroProduto.js com validação dos campos e valores.
- [ ] Integrar cadastro à função comum de salvar disponibilizada por Pandini.
- [ ] Criar Orçamentos salvos com lista, status e estado vazio.
- [ ] Integrar consulta e abertura do detalhe por ID com as rotas/dados de Pandini.
- [ ] Validar os fluxos e entregar para revisão de Pandini.

## Navegação proposta

- Implementado: Login → Home ao tocar em Entrar, usando replace. O Login não fica na pilha para voltar após entrar.
- Pendente: sessão, autenticação e ação de sair que retorna ao Login.
- Menu principal proposto: Home · Produtos · Orçamentos · Venda.
- Orçar: Produtos → Carrinho → Detalhe do orçamento → compartilhar.
- Consultar: Orçamentos salvos → Detalhe do orçamento → converter em venda.
- Vender: Nova venda → Finalizar venda → Recibo.
- Cadastrar: Produtos → Cadastro de produto.
- Escanear: atalho na Home ou em Produtos → Scanner → produto encontrado.

Compartilhar é uma ação no orçamento/recibo. O scanner é uma tela auxiliar. A proteção de acesso e as rotas ficam com Pandini.

## Ordem de trabalho e dependências

1. Em paralelo: Ferrari termina o Login visual; Danner refatora a Home; Pandini define navegação, sessão e dados mínimos.
2. Ferrari passa Login para Pandini e segue para Cadastro; Danner segue para Produtos.
3. Pandini entrega carrinho e orçamento; Ferrari trabalha na lista de salvos quando o formato/consulta estiver combinado.
4. O time valida Login → Home → Produtos → Carrinho → Orçamento → Compartilhar → Consultar salvos.
5. Depois desse marco aprovado: venda, finalização e recibo. Scanner e persistência entram em incrementos próprios.

Dados de negócio começam fictícios. Antecipar autenticação real não autoriza automaticamente integrar produtos, estoque e vendas ao banco.
Se uma função comum ainda não existe, o dono da tela informa a dependência; não cria outra implementação para contornar o responsável.

## Critérios de conclusão

- [ ] Login permite entrar/sair e impede acesso interno sem sessão, conforme o modelo aprovado.
- [ ] As telas usam a mesma origem de produtos e o mesmo carrinho.
- [ ] Adicionar o mesmo produto aumenta a quantidade sem duplicar linhas.
- [ ] Valores são guardados em centavos e os totais foram conferidos.
- [ ] Orçamento preserva os preços e não baixa estoque ao salvar/compartilhar.
- [ ] A lista abre o orçamento correto e informa a limitação de persistência da fase atual.
- [ ] Na etapa de venda, somente a confirmação baixa estoque e não permite registro duplicado.
- [ ] Cada entrega tem diff revisado, checks aplicáveis e teste manual informado.

Não marcar como concluída uma funcionalidade que apenas tem botão, visual ou alerta simulando sucesso. Registre a validação e as pendências na revisão da entrega.

## Registro — 16/10/2026

- Implementados src/app/_layout.tsx e src/app/home.tsx; index.tsx agora apresenta Login.
- Login.js navega diretamente para /home, sem validação, alertas ou espera artificial.
- Nenhuma dependência adicionada; a Home existente foi preservada.
- Lint e TypeScript passaram sem avisos; git diff --check passou.
- Validação no celular ainda não registrada. Não há sessão, autenticação ou proteção de rotas nesta entrega.
- Próxima retomada: validar o fluxo no aparelho e escolher com Pandini o próximo incremento.
