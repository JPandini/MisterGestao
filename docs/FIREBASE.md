# Firebase — configuração inicial

Projeto: mistergestao-5ebe1. Integração pelo Firebase JavaScript SDK, compatível com Expo Go.

## Ambiente local

O arquivo `MisterGestao/.env.example` documenta os seis valores públicos do app Firebase. Copie-o para `.env`, preencha os valores em **Configurações do projeto → Seus apps** e não compartilhe nem versione o arquivo preenchido. O `.env` é ignorado pelo Git. O checkout atual não inclui essas configurações locais. Sem as variáveis, o app abre uma tela com a orientação de setup; login e Firestore ficam indisponíveis até preencher o arquivo e reiniciar o Expo.

## Arquivos

- MisterGestao/src/services/firebase.js: configuração pública via variáveis EXPO_PUBLIC_FIREBASE_*, instância única do app Firebase e Firestore.
- MisterGestao/src/services/auth.js: autenticação na web.
- MisterGestao/src/services/auth.native.js: autenticação Android/iOS com persistência em AsyncStorage.
- MisterGestao/src/services/products.js: consulta em tempo real e cadastro de produtos no Firestore.
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

Referência Expo: https://docs.expo.dev/guides/using-firebase/

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
