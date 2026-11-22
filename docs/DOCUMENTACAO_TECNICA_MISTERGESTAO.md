# Documentação técnica do MisterGestão

Guia de estudo e apresentação · 22 de novembro de 2026

O MisterGestão reúne catálogo, estoque, orçamentos e vendas para a loja Mister MotoPlace. O atendente consulta os produtos, monta uma proposta, compartilha com o cliente e confirma a venda quando o orçamento estiver dentro da validade. O Dashboard acompanha as vendas e as movimentações de estoque da semana.

O exemplo mais fácil de explicar é o ciclo de um produto. O orçamento guarda uma cópia dos itens e dos preços ofertados. A venda consulta o saldo atual e registra sua baixa. Assim, a loja consegue editar o catálogo depois de enviar uma proposta e manter o valor que ofereceu ao cliente.

## Arquitetura

| Componente | Papel no projeto |
| --- | --- |
| JavaScript, React Native 0.88 e Expo SDK 58 | Interface para Android, iOS e web a partir do mesmo projeto. |
| React Navigation 7 | Controla a tela de login, a pilha autenticada e as abas **Hoje**, **Produtos**, **Orçamentos** e **Venda**. |
| Firebase Authentication | Autentica por e-mail e senha. O app espera a restauração da sessão antes de abrir as telas internas. |
| Cloud Firestore | Guarda os dados da loja. As consultas com `onSnapshot` atualizam as telas à medida que os dados mudam. |
| Firebase Cloud Functions e Cloud Scheduler | Executam a rotina de lembretes e cancelamento quando ela estiver publicada. |
| Expo Push Service | Encaminha os avisos aos serviços de notificação do Android e do iOS quando o canal estiver configurado. |

```text
Atendente → App Expo → Firebase Authentication → sessão da conta
                    → Firestore → catálogo, estoque, clientes, orçamentos e vendas
                    → WhatsApp ou PDF → proposta compartilhada com o cliente

Cloud Scheduler → Cloud Function → Firestore → lembrete no sino do app
                                            → fila → Expo Push Service → celular
```

As telas ficam em `src/view/`. Os serviços em `src/services/` concentram consultas, validações e gravações. Os contextos em `src/context/` compartilham sessão, catálogo, carrinho e avisos. O carrinho usa AsyncStorage para sobreviver ao fechamento do app. As operações da loja são persistidas no Firestore. [Navegação do app](../MisterGestao/src/app/AppNavigator.js) · [Referência do Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/)

## Modelo de dados

As coleções comerciais ficam sob `lojas/mister-motoplace`. A coluna de caminho mostra o trecho que identifica cada documento dentro desse nó.

| Caminho | O que guarda |
| --- | --- |
| `produtos/{id}` | Nome, código, categoria, marca, medida, preço de venda, custo, lucro sobre o custo, saldo, estoque mínimo e foto opcional. |
| `categorias/{id}` e `marcas/{id}` | Opções usadas nos formulários do catálogo. |
| `sequenciasProdutos/{categoryId}` | Último número gerado na categoria. |
| `clientes/{telefone}` | Nome e telefone normalizado. O telefone identifica o registro para evitar cadastros duplicados. |
| `orcamentos/{id}` | Cópia dos itens ofertados, cliente, valores, validade, status, autor e data de criação. |
| `vendas/{orcamentoId}` | Venda vinculada ao orçamento, com total, autor e data. |
| `movimentos/{id}` | Entrada ou saída por produto, com quantidade, autor e data. O Dashboard usa esses registros para montar o histórico. |

Os lembretes ficam em `usuarios/{uid}/notificacoesOrcamentos/{id}`. O registro de aparelhos fica em `dispositivosPush/{token}`, e a fila de envios fica em `enviosPushOrcamentos/{id}`. Essas coleções ficam fora do nó da loja. [Regras do Firestore do projeto](../MisterGestao/firestore.rules)

## Catálogo e estoque

Ao cadastrar um produto, o app gera um código como **CAM-001** a partir das três primeiras letras do nome da categoria e de um contador da categoria. A leitura do próximo número serve de prévia. Na hora de salvar, uma transação confirma o número e grava o produto junto com o contador. Se dois atendentes cadastrarem ao mesmo tempo, o Firestore pode refazer a transação com os dados atualizados. [Serviço de produtos](../MisterGestao/src/services/products.js) · [Transações do Firestore](https://firebase.google.com/docs/firestore/manage-data/transactions)

O botão **Editar** abre o formulário preenchido. Ele permite mudar nome, categoria, marca, medida, foto, preços e estoque mínimo. A gravação preserva o ID e o código. Se outra pessoa tiver modificado um dos mesmos campos, o app pede que o atendente reabra a edição. A ação **Entrada** incrementa a quantidade e registra o movimento positivo no mesmo lote. A venda registra o movimento negativo. [Tela de produtos](../MisterGestao/src/view/Produtos.js) · [Formulário de produto](../MisterGestao/src/view/CadastroProduto.js)

O app armazena valores monetários como números inteiros em centavos. Um custo de R$ 100,00 e uma venda de R$ 125,00 dão 25% de lucro sobre o custo, calculado por `(venda - custo) / custo × 100`. Produtos antigos podem ter apenas o preço de venda. Quando há uma foto, o app limita a maior dimensão a 800 pixels e grava um JPEG em Base64 no documento, com limite de 700 mil caracteres. [Cálculo de preços](../MisterGestao/src/utils/productPricing.js) · [Processamento de fotos](../MisterGestao/src/utils/productPhoto.js)

## Do orçamento à venda

1. **Montar.** O atendente adiciona produtos ao carrinho e informa validade, desconto, frete e observações. O total é o subtotal menos o desconto mais o frete.
2. **Salvar.** O Firestore grava uma cópia do nome, da medida, do preço e da quantidade de cada item. O orçamento começa em aberto, e a baixa de estoque fica para a confirmação da venda.
3. **Compartilhar.** O atendente seleciona ou cadastra o cliente e abre uma mensagem pré-preenchida no WhatsApp. O envio é confirmado no WhatsApp. No celular, o app pode gerar e compartilhar um PDF. Na web, abre a impressão do navegador para salvar o arquivo.
4. **Confirmar a venda.** O serviço relê o status do orçamento, a validade e os saldos. Com estoque suficiente, ele grava a venda, os movimentos de saída e o status `converted` em uma única transação. A venda usa o ID do orçamento como identificador para impedir duplicação.
5. **Conferir o Dashboard.** A tela reúne vendas por semana e soma as entradas e saídas registradas. Quando a consulta ao estoque falha, a interface mostra o erro e permite tentar novamente.

O cancelamento manual grava `cancelled`, a data e o autor. Um orçamento cancelado fica no histórico com seus itens e valores. A confirmação de venda e o cancelamento consultam o mesmo documento, de modo que uma venda concluída fica protegida contra cancelamento posterior. [Serviço de orçamentos](../MisterGestao/src/services/orcamentos.js) · [Serviço de vendas](../MisterGestao/src/services/vendas.js) · [Dashboard](../MisterGestao/src/view/Dashboard.js)

**Exemplo para a apresentação.** Um produto tem 10 unidades e preço de R$ 125,00. Um orçamento de duas unidades, com desconto de R$ 10,00 e frete de R$ 15,00, fica em **R$ 255,00**. Ao salvar a proposta, o saldo é 10. Ao confirmar a venda, o saldo passa a 8, e o Dashboard recebe a saída de duas unidades.

## Validade e acompanhamento automático

A validade comercial é escolhida no orçamento e pode ir até sete dias. Ela determina até quando é possível confirmar a venda. O texto **Vencido** é calculado a partir da validade e da idade do orçamento. O lembrete e o cancelamento avaliam a idade desde a criação dos documentos com status `open`. Uma proposta com validade comercial de três dias pode aparecer como vencida e continuar em aberto no banco até o cancelamento.

| Dias completos desde a criação | Ação se o orçamento seguir em aberto |
| --- | --- |
| 1 | Gera o primeiro lembrete para quem criou o orçamento. |
| 5 | Gera o segundo lembrete. |
| 7 | Gera o último lembrete e avisa sobre o cancelamento. |
| 8 | Registra o cancelamento automático no Firestore. |

A função `verificarPrazosOrcamentos` está configurada para verificar os prazos a cada 15 minutos. Depois de publicada, a checagem roda na nuvem mesmo com o app fechado. O aviso do sino e a entrada na fila de push são gravados na mesma transação, com identificação por orçamento e dia para evitar lembretes duplicados. Se a rotina atrasar e encontrar mais de uma data vencida, ela usa o marco mais recente que ainda se aplica.

O **sino** mostra os avisos não lidos. Tocar em um aviso interno marca a leitura e abre o orçamento. O **push** exige uma versão instalada com as credenciais da plataforma e permissão do usuário. A mensagem do celular informa a idade da proposta, e o toque abre a lista de avisos. O servidor acompanha os recibos do Expo para tratar tentativas de entrega e remover registros de aparelhos informados como desativados. [Função agendada](../MisterGestao/functions/index.js) · [Rotina de prazos](../MisterGestao/functions/prazosOrcamentos.js) · [Configuração do Expo Push](https://docs.expo.dev/push-notifications/push-notifications-setup/) · [Recibos de push](https://docs.expo.dev/push-notifications/sending-notifications/)

## Acesso e proteção dos dados

O login identifica o atendente. As regras do Firestore aplicam as permissões onde os dados são lidos ou gravados. A versão atual atende uma loja compartilhada, com operações internas para contas autenticadas. As regras validam campos e status de acordo com a operação. Cada conta lê os próprios lembretes.

O link enviado ao cliente permite consultar um orçamento individual pelo ID. Quem recebe o link pode ver os dados da proposta, inclusive nome e contato quando preenchidos. A listagem geral exige login. Use dados fictícios na demonstração e trate o link da proposta como informação do atendimento. [Regras do projeto](../MisterGestao/firestore.rules) · [Regras de segurança do Firebase](https://firebase.google.com/docs/firestore/security/get-started)

## Execução e testes

Execute os comandos na pasta `MisterGestao` que contém `package.json` e `firebase.json`. Configure o `.env` com os valores do app Firebase de demonstração antes de abrir o projeto. No iPhone físico, use o Expo Go compatível com o SDK 58 e a mesma conta Expo no celular e no Expo CLI. O login do MisterGestão é feito depois, com uma conta do Firebase Authentication. [Configuração do Firebase no projeto](FIREBASE.md#ambiente-local) · [Login do Expo Go no iPhone](https://docs.expo.dev/troubleshooting/expo-go-sign-in-required/)

```powershell
npm ci
npx expo start --clear
```

Os testes de integração usam dados fictícios no projeto local `demo-mistergestao`. O Firestore Emulator precisa de Java, e os testes da função usam as dependências próprias de `functions/`. O teste dos prazos simula a passagem dos dias e as respostas do Expo, o que permite demonstrar a lógica em minutos.

```powershell
npm --prefix functions ci
npm run lint
npx firebase-tools emulators:exec --only firestore --project demo-mistergestao --config firebase.emulators.json "node scripts/check-pendencias.cjs && node scripts/check-compartilhamento.cjs && node scripts/check-prazos.cjs"
```

Entre os casos verificados estão o cadastro simultâneo, a edição com entrada de estoque concorrente, a venda duplicada, o cancelamento, a leitura do Dashboard, as permissões de clientes e avisos, e as tentativas de push com respostas simuladas. [Testes de catálogo, estoque e vendas](../MisterGestao/scripts/check-pendencias.cjs) · [Testes de compartilhamento](../MisterGestao/scripts/check-compartilhamento.cjs) · [Testes de prazos e push](../MisterGestao/scripts/check-prazos.cjs)

## Estado da entrega

| Área | Situação conhecida |
| --- | --- |
| Aplicativo | Web publicada em 22 de novembro de 2026. O pacote público confere com o exportado localmente. Lint e exportação para Android e iOS passaram. |
| Dashboard e edição de produtos | As regras locais passaram no emulador e foram publicadas em produção. Falta conferir os fluxos com uma conta de atendente no site publicado. |
| Lembretes e cancelamento | As regras e os índices foram publicados. A função agendada segue pendente e exige a API de Cloud Functions habilitada e plano Blaze. A primeira execução também processa orçamentos antigos elegíveis. |
| Push no celular | Fluxo validado com envio simulado. O teste real depende das credenciais FCM v1 no Android ou APNs no iOS e de um build instalado. |

Um **403 no Firebase CLI** indica que a conta administrativa usada naquela consulta teve o acesso recusado. Já **`permission-denied` no Dashboard** é o erro do aplicativo ao tentar ler o histórico de movimentações. A investigação em produção começa conferindo as regras publicadas da coleção `movimentos` com uma conta autorizada. [Procedimento de publicação](FIREBASE.md) · [Requisitos das Cloud Functions](https://firebase.google.com/docs/functions/get-started#deploy_functions_to_a_production_environment)

## Roteiro de apresentação

Use oito minutos como referência e ajuste ao tempo disponível.

| Tempo | O que mostrar |
| --- | --- |
| 1 min | Apresente a loja, quem usa o app e o problema de acompanhar estoque, propostas e vendas no mesmo fluxo. |
| 1 min | Explique as telas, a autenticação e o Firestore usando o diagrama de arquitetura. |
| 3 min | Mostre um produto fictício, edite um campo e monte um orçamento com duas unidades. Explique o cálculo do total e mostre o compartilhamento. |
| 2 min | Confirme a venda no ambiente preparado e mostre a baixa no estoque e a saída no Dashboard. Use a transação para explicar o que acontece se dois atendentes confirmarem ao mesmo tempo. |
| 1 min | Apresente os prazos de 1, 5, 7 e 8 dias e diga quais etapas ainda dependem da publicação e do teste de push em aparelho. |

Antes de apresentar, confira o login e a leitura do Dashboard no ambiente da demonstração. Se o acesso falhar no site, mostre a saída do caso de estoque do emulador. Para os lembretes, use o teste de prazos com o relógio simulado.

## Perguntas para ensaiar

**O preço mudou para R$ 140,00 depois do envio. Quanto vale o orçamento de R$ 125,00 por unidade?** O preço da proposta existente continua em R$ 125,00 por unidade. O catálogo passa a mostrar R$ 140,00.

**O orçamento pede duas unidades, mas resta uma. O que acontece?** A confirmação exibe estoque insuficiente. O orçamento, o saldo e o histórico de movimentações ficam como estavam antes da tentativa.

**O que acontece se dois atendentes confirmarem a mesma venda?** A primeira transação bem-sucedida marca o orçamento como convertido. A outra tentativa encontra esse novo status e retorna erro antes de baixar o saldo novamente.

**Por que um aviso de sete dias pode chegar depois do horário exato?** A função é agendada de 15 em 15 minutos. Ela processa o marco na próxima execução aplicável, e a entrega no celular depende do serviço de push.

**Por que o Dashboard pode dar erro depois do login?** A sessão identifica o atendente. O Firestore ainda precisa autorizar a consulta pelas regras publicadas. Se a regra de `movimentos` recusar a leitura, o app mostra a falha de acesso.

**O teste simulado confirma que o push apareceu em um iPhone?** Ele confirma como o servidor enfileira, envia e trata as respostas simuladas. A entrega em um iPhone precisa ser verificada em um build instalado com APNs configurado.
