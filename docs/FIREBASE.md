# Firebase — configuração inicial

## Produtos, condições do orçamento e vendas — 15/11/2026

- O código de novos produtos é automático: três primeiras letras da categoria sem acentos, em maiúsculas, seguidas de sequência com pelo menos três dígitos (`Câmara de ar` → `CAM-001`). Categorias com menos de três letras completam o prefixo com `X`. Cada categoria tem contagem própria, inclusive quando duas categorias começam com as mesmas letras; nesse caso, o código visível pode coincidir entre categorias, enquanto o ID do produto permanece único.
- O campo é um input desabilitado, com fundo cinza, preenchido com o próximo código completo assim que a categoria é selecionada. A consulta em tempo real acompanha os novos cadastros sem reservar ou consumir números; trocar de categoria encerra a consulta anterior. Erro de permissão ou conexão aparece abaixo do campo com opção de tentar novamente. O número definitivo é confirmado na transação de salvamento e pode avançar se outro vendedor salvar antes.
- A sequência fica em `lojas/mister-motoplace/sequenciasProdutos/{categoryId}` com `prefix`, `lastNumber`, `code` e `productId`. Novos produtos também guardam `categoryId`, validado contra o cadastro de categorias. Produto e contador são gravados na mesma transação; uma falha não consome o número. Ao iniciar uma categoria, o serviço consulta os códigos existentes somente dela e continua depois do maior, inclusive em produtos antigos sem `categoryId`. Produtos já cadastrados mantêm seus códigos. Contadores anteriores por prefixo não são reutilizados.
- O cadastro tem **Valor de custo (R$)**, **Valor de venda (R$)** e **Lucro (%)**. Lucro é calculado sobre o custo: `(venda - custo) / custo × 100`. Informar percentual calcula a venda, arredondada para centavos; informar venda calcula o percentual. Ao mudar o custo, preserva o último campo escolhido como referência (venda ou percentual). Zero de lucro e venda abaixo do custo são aceitos; custo e venda devem ser maiores que zero. Entradas inválidas ou limpas não mantêm cálculos antigos.
- Novos produtos guardam `costPrice` em centavos, `price` como valor de venda em centavos e `profitPercentage` numérico, calculado pelo serviço a partir dos valores finais e arredondado para duas casas. As regras exigem os novos campos. Produtos antigos continuam usando seu `price` original como venda, sem inventar custo; não precisam de migração. Carrinho, orçamentos e PDF usam somente a venda, sem expor custo ou lucro.
- A foto pode vir da câmera ou galeria, ser substituída ou removida antes de salvar. `expo-image-picker` e `expo-image-manipulator` reduzem a maior dimensão para 800 px e codificam em JPEG. O campo `photo` contém a imagem base64, limitada a 700.000 caracteres; não contém um caminho temporário do aparelho. Não requer Firebase Storage. As regras também limitam o tamanho da foto.
- No carrinho, validade em `DD/MM/AAAA` (inicialmente sete dias), desconto em reais, frete em reais e observações são editáveis antes de gerar. O serviço persiste valores em centavos e validade em `AAAA-MM-DD`; rejeita datas inexistentes ou anteriores a hoje, desconto maior que o subtotal e valores inválidos. O carrinho é limpo depois de salvar com sucesso; orçamento não baixa estoque.
- O detalhe mostra o status e oferece **Gerar / compartilhar PDF**. O compartilhamento com cliente também tem botão explícito de PDF, com erros visíveis. Android/iOS geram e compartilham arquivo; web abre impressão para salvar como PDF e informa se o navegador bloqueou a janela. PDF contém o número completo, cliente, itens, subtotal, desconto, frete, total, validade e observações; tabelas longas repetem o cabeçalho.
- Venda bloqueia orçamento vencido, valida quantidades e agrupa produtos repetidos em orçamentos antigos antes de baixar estoque. Estoque, conversão e registro da venda continuam na mesma transação. A regra de validade usa o fim do dia no horário de Brasília; orçamentos antigos sem validade continuam aceitos. Falhas de consulta de vendas são mostradas na interface.
- No detalhe, **Cancelar orçamento** abre a confirmação com **Manter orçamento** e **Confirmar cancelamento**. Cancelamento permite orçamento em aberto, inclusive vencido, e grava apenas `status: 'cancelled'`, `cancelledAt` e `cancelledBy`. Itens, valores e estoque permanecem iguais; o orçamento continua no histórico como **Cancelado** e sai das opções de venda. Serviço e regras bloqueiam cancelamento de orçamento já convertido ou com venda registrada. Cancelamento e venda concorrentes disputam o mesmo documento: apenas uma operação pode concluir. Repetir um cancelamento já concluído não sobrescreve autor ou data. Reabrir orçamento cancelado não é permitido.
- PDF e mensagem de compartilhamento incluem o status; orçamento cancelado recebe destaque no PDF e aviso de que está sem efeito para venda. O link público mostra esse status ao carregar os dados atuais. PDFs e mensagens enviados anteriormente são cópias e não se atualizam.

**Publicação necessária:** publicar o `firestore.rules` desta versão antes de usar o novo cadastro ou cancelar orçamentos. As regras anteriores não liberam a coleção de sequências, os campos de custo e lucro ou a atualização de cancelamento. Publicação de regras remotas e teste em aparelho real não foram executados nesta alteração. Na pasta que contém `firebase.json`:

```powershell
npx firebase-tools deploy --only firestore:rules --project mistergestao-5ebe1
```

Tentativa de publicação nesta sessão: recusada com HTTP 403 por falta de `serviceusage.services.use`. A consulta direta das regras pela API também retornou HTTP 403. As regras remotas não puderam ser verificadas ou atualizadas. Alternativa com uma conta autorizada: abrir https://console.firebase.google.com/project/mistergestao-5ebe1/firestore/default/rules , substituir o conteúdo pelo arquivo completo `MisterGestao/firestore.rules` deste checkout e clicar em **Publicar**. Não copiar só o bloco de sequências, pois as regras de produtos também validam a gravação conjunta do contador.

O aviso de permissão no cadastro agora orienta conferir as regras de produtos e sequências; sair e entrar novamente não atualiza regras do Firestore.

Não é necessário migrar ou renumerar os produtos atuais. Versões anteriores do cadastro deixam de cadastrar após publicar essas regras; atualizar o app junto. Builds próprios precisam ser reconstruídos para incluir os dois módulos Expo adicionados; as dependências são compatíveis com Expo Go no SDK 57.

Validação local: lint, exportação Android/web, 18 cenários de produtos/orçamentos/vendas e sete regressões de clientes/compartilhamento no Firestore Emulator, sem dados reais. Incluídas sequência independente de categorias com o mesmo prefixo, prévia completa sem consumir número, atualização após cadastro, cálculo de custo/venda/lucro nos dois sentidos, arredondamento em centavos, valores inválidos e persistência. Cancelamento testado com orçamento aberto, vencido e vendido, repetição, ausência de sessão, autor inválido, preservação de estoque/valores, histórico e disputa com venda. Confirmação em duas etapas e botões por status verificados por renderização da tela. PDF curto, longo e cancelado renderizados e inspecionados visualmente. Câmera, galeria e compartilhamento nativo ainda precisam de teste em aparelho. A exportação informa que o favicon já referenciado no projeto não está presente no checkout.

```powershell
npx firebase-tools emulators:exec --only firestore --project demo-mistergestao --config firebase.emulators.json "node scripts/check-pendencias.cjs && node scripts/check-compartilhamento.cjs"
```

Projeto: mistergestao-5ebe1. Integração pelo Firebase JavaScript SDK, compatível com Expo Go.

## Ambiente local

O arquivo `MisterGestao/.env.example` documenta os seis valores públicos do app Firebase. Copie-o para `.env`, preencha os valores em **Configurações do projeto → Seus apps** e não compartilhe nem versione o arquivo preenchido. O `.env` é ignorado pelo Git. O checkout atual não inclui essas configurações locais. Sem as variáveis, o app abre uma tela com a orientação de setup; login e Firestore ficam indisponíveis até preencher o arquivo e reiniciar o Expo.

## Arquivos

- MisterGestao/src/services/firebase.js: configuração pública via variáveis EXPO_PUBLIC_FIREBASE_*, instância única do app Firebase e Firestore.
- MisterGestao/src/services/auth.js: autenticação na web.
- MisterGestao/src/services/auth.native.js: autenticação Android/iOS com persistência em AsyncStorage.
- MisterGestao/src/services/products.js: consulta em tempo real e cadastro de produtos no Firestore.
- MisterGestao/src/services/orcamentos.js: salvamento, consulta por ID e listagem em tempo real de orçamentos.
- MisterGestao/src/context/ProductsContext.js: compartilha produtos entre Home e Produtos.
- MisterGestao/firestore.rules: leitura/cadastro disponíveis para qualquer conta autenticada no app; outros caminhos ficam fechados.

Para a futura integração, importe auth de src/services/auth (sem extensão). O Metro seleciona auth.native.js no celular. Não inicialize outro Auth nas telas.

A configuração cliente não é uma chave privada. As permissões do banco dependem de regras de segurança. Por decisão de Pandini, nesta etapa todas as contas autenticadas compartilham a consulta e o cadastro de produtos da loja.

## Console — etapa manual

1. Abra https://console.firebase.google.com/project/mistergestao-5ebe1/authentication .
2. Comece a configuração de Authentication, se solicitado.
3. Em Método de login / Sign-in method, habilite E-mail/senha e salve. Login por link de e-mail não é necessário.
4. Em Usuários, adicione uma conta de teste com e-mail e senha. Não compartilhe a senha no chat nem no repositório.

Referência: https://firebase.google.com/docs/auth/web/password-auth

## Estado desta entrega

O Login usa signInWithEmailAndPassword. AuthProvider observa onAuthStateChanged e aguarda restaurar a sessão antes de montar as telas. React Navigation mostra Login sem sessão e as telas internas após entrar; sair desmonta a navegação autenticada.

O formulário valida campos vazios/e-mail, bloqueia envio duplicado e mostra carregamento e erros em português. A Home identifica a pessoa pelo displayName ou parte inicial do e-mail e oferece Sair, com tratamento de falha. A persistência no aparelho ainda precisa de teste manual. A proteção de telas não substitui regras de acesso no banco.

O cadastro e a listagem de produtos usam Firestore. O ID do documento fica em `id`; preço em centavos inteiros; estoque e mínimo em inteiros não negativos; cada registro também guarda `createdAt` e `createdBy`.

## Acesso pelo login e regras

Os produtos da loja são gravados em `lojas/mister-motoplace/produtos`. Qualquer conta autenticada pelo Firebase Authentication pode consultar e cadastrar produtos, sem documento de membro, perfil ou liberação individual do UID. Documentos antigos na coleção `membros`, se existirem, não participam da autorização. Atualização e exclusão permanecem bloqueadas nesta etapa.

As regras de `firestore.rules` exigem sessão autenticada e validam tipos, valores, autor da inclusão e campos permitidos. O campo `createdBy` registra quem cadastrou, sem limitar quem pode consultar outros produtos. Publique-as com `npx firebase-tools deploy --only firestore:rules` na pasta `MisterGestao`, com acesso autorizado ao projeto correto. Também é possível copiar o conteúdo do arquivo para **Firebase Console → Firestore → Regras** e clicar em **Publicar**. Alterar o arquivo local não publica as regras automaticamente.

O `.env` local foi configurado e o usuário informou a criação do banco `(default)`. A publicação anterior das regras pelo CLI foi recusada com erro 403 por falta de `serviceusage.services.use`; confirme a publicação das regras atuais antes de usar o banco. Os mocks antigos foram removidos e não foram importados; a lista começa vazia até existirem documentos reais.

Em caso de permissão negada, confira a sessão e se as regras atuais foram publicadas no projeto correto. Não crie perfis ou associações de membros para resolver esse erro. O app informa que o banco recusou a operação; recarregar a tela tenta novamente a assinatura em tempo real.

Analytics e Storage não são necessários para esta etapa.

## Orçamentos — 08/11/2026

Os orçamentos usam `lojas/mister-motoplace/orcamentos`, conforme o serviço e as regras já existentes. A aba Orçamentos abre a lista de salvos, ordenada por `createdAt` do mais recente para o mais antigo. A consulta acompanha alterações enquanto a aba está aberta e é encerrada ao sair; voltar à aba inicia uma nova consulta. A busca local aceita número (ID), cliente e contato. Tocar no registro abre a rota `Orcamento` com seu ID.

O fluxo Produtos → Carrinho → Gerar orçamento salva uma cópia dos itens e preços, sem alterar estoque. O salvamento valida valores em centavos e quantidades e impede envios simultâneos pelo botão. Orçamentos em aberto com validade anterior ao dia atual aparecem como vencidos, sem alterar seu status no banco.

Verificados lint, exportação Android/web e cenários de serviço/tela com Firebase simulado (lista vazia, dois registros, busca, detalhe por ID, validade, erros, nova tentativa, encerramento da consulta e envio duplicado). Teste no aparelho com sessão e Firestore reais permanece pendente. As regras remotas não foram publicadas nem verificadas nesta entrega.

Referência Expo: https://docs.expo.dev/guides/using-firebase/

## Clientes e compartilhamento — 08/11/2026

No detalhe do orçamento, **Compartilhar pelo WhatsApp** abre a escolha de cliente, com busca por nome/telefone e cadastro no mesmo fluxo. Os únicos campos de negócio são `nome` e `telefone` (DDD + número brasileiro; o código +55 é aceito na entrada e acrescentado no link do WhatsApp). O cadastro fica em `lojas/mister-motoplace/clientes/{telefone}`, com `createdAt` e `createdBy`. O telefone normalizado identifica o documento: cadastros simultâneos com o mesmo número reutilizam o cliente existente sem sobrescrever seu nome.

Escolher um cliente salva `cliente: { id, nome, contato }` no orçamento, preservando os demais campos. O detalhe e a lista passam a mostrar o destinatário salvo. As regras permitem apenas essa alteração no orçamento, validando o cliente contra seu cadastro; itens, valores, status e estoque não são alterados pelo compartilhamento. Clientes podem ser consultados e criados por contas autenticadas; edição e exclusão ficam bloqueadas.

Depois de salvar a seleção, **Abrir WhatsApp** abre `https://wa.me/55{telefone}?text=...` com uma mensagem contendo loja, número do orçamento, cliente, itens/quantidades/preços, subtotal, desconto, frete, total, validade e observações. A tela permite conferir a mensagem antes de abrir. O envio é confirmado pela pessoa no WhatsApp; abrir o aplicativo não registra sucesso de envio no banco.

Validados sete cenários de serviços e regras no Firestore Emulator (projeto isolado `demo-mistergestao`) e onze cenários de interface com abertura de links simulada. Para repetir os testes de banco, na pasta do app: `npx firebase-tools emulators:exec --only firestore --project demo-mistergestao --config firebase.emulators.json "node scripts/check-compartilhamento.cjs"`. Java é necessário. Lint e exportação Android/web também passaram; teste de abertura do WhatsApp em aparelho real permanece pendente.

**Publicação pendente:** a consulta às regras remotas retornou HTTP 403 com a sessão do CLI disponível. As regras novas foram preparadas em `MisterGestao/firestore.rules`, mas não publicadas. Uma conta com acesso ao projeto deve publicar pelo Firebase Console → Firestore → Regras, ou executar `npx firebase-tools deploy --only firestore:rules --project mistergestao-5ebe1`. Sem essa publicação, o banco pode recusar o cadastro de clientes e a associação ao orçamento.

Referência WhatsApp: https://faq.whatsapp.com/5913398998672934

## Dependências e verificações — 22/10/2026

Instalados via Expo CLI: firebase 12.10.0 e @react-native-async-storage/async-storage 2.2.0. Firebase 12.10.0 foi fixado porque o Firebase 13.1.0 exige Node >=24.12.0 em seus módulos, enquanto o ambiente usa Node 24.11.1.

Verificação local de inicialização: projectId correto e reutilização da instância padrão confirmados, sem operação no banco ou criação de usuário. Lint e TypeScript passaram. Mensagens de credenciais, rede, limite de tentativas e erro desconhecido conferidas. Bundle Android exportado com sucesso (sem bytecode), após renovar o cache do Metro. Teste de login, persistência e aparelho ainda pendentes.

## Fluxo a conferir no aparelho

Na pasta MisterGestao (a que contém package.json), execute npx expo start --clear e abra no Expo Go. Não envie senhas para o chat.

1. Sem sessão: o app deve mostrar Login. Campos vazios/e-mail inválido devem mostrar erro sem abrir Home.
2. Tente uma senha incorreta: mostrar erro de credenciais e permitir nova tentativa.
3. Entre com a conta de teste criada no console: abrir Home e conferir o nome exibido.
4. Abra Produtos pelo atalho e volte à Home.
5. Feche e reabra o app: a sessão deve ser restaurada, sem mostrar telas internas antes dessa verificação.
6. Toque em Sair: retornar ao Login. O botão Voltar não deve reabrir Home/Produtos.
7. Sem sessão, tente abrir mistergestao://home e mistergestao://produtos em um ambiente configurado para esse scheme: permanecer no Login. No Expo Go, utilize o URL do projeto seguido de /--/home ou /--/produtos.
8. Desconecte a internet e tente entrar com a sessão encerrada: mostrar erro de conexão e permitir nova tentativa.

Configuração de E-mail/senha e criação da conta no console informadas como concluídas pelo usuário. Não houve autenticação real executada pelo agente nem alteração de produtos, estoque ou vendas no banco.
