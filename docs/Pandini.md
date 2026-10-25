# Guia de desenvolvimento — Pandini

Responsável: Pandini. Papel: tech lead e desenvolvedor. Branch de referência: main; confirme a branch de trabalho antes de editar.
Este guia registra o trabalho atual. As decisões registradas em 25/10/2026 substituem as orientações históricas abaixo que mandavam manter Expo Router, TypeScript ou dados de produtos apenas fictícios.

## 1. Leitura e organização

- [Divisão e acompanhamento](TODO.md): responsáveis, ordem e pendências do time.
- [Guia geral](GUIA_CODEX_MISTERGESTAO.md): contexto do produto, regras e roteiro original.
- [Guia do Danner](GUIA_DANNER.md): Home e Produtos.
- [Guia do Ferrari](GUIA_FERRARI.md): Login visual, Cadastro de produto e Orçamentos salvos.

O guia geral foi recebido como referência. Seus exemplos de primeira resposta, instalação do pacote e aprovações não são ordens para iniciar uma implementação.
As divisões combinadas depois dele estão registradas em TODO.md. As instruções atuais de Pandini prevalecem.

## 2. Sua responsabilidade

Você assume a maioria das telas e as partes com mais regras ou integração:

| Área | Sua entrega |
| --- | --- |
| Navegação | Rotas, layout, menu, voltar, entrada e saída das telas. |
| Sessão e Login | Integrar o Login entregue por Ferrari, entrar/sair e controlar acesso às rotas. |
| Dados comuns | Produtos, carrinho, orçamentos e vendas usados pelas telas. |
| Carrinho | Quantidades, cliente, desconto, frete, validade e totais. |
| Detalhe do orçamento | Salvar, exibir, compartilhar, aprovar, cancelar e converter. |
| Nova venda | Preparar venda direta ou a partir de um orçamento. |
| Finalizar venda | Validar, confirmar uma única vez e atualizar estoque. |
| Recibo | Consultar a venda salva e compartilhar o recibo demonstrativo. |
| Scanner | Leitura de código, permissão e alternativa de busca manual. |
| Banco e persistência | Definir quando entram e fazer a integração com segurança. |
| Revisão | Integrar as branches e conferir o funcionamento entre as telas. |

## 3. Decisões antes da implementação

- Decisão de 25/10/2026: migrar para React Navigation, manter somente JavaScript, compartilhar componentes em `src/components/` e cadastrar/listar produtos no Firestore.
- Modelo desta etapa: estoque compartilhado da Mister MotoPlace em `lojas/mister-motoplace/produtos`. Qualquer conta logada pode consultar e cadastrar, sem perfis ou liberação individual. Leia `FIREBASE.md` para publicar as regras.
- O `.env` local foi configurado e o banco `(default)` foi criado pelo usuário. Ainda é necessário publicar as regras atuais de `firestore.rules`.
- Primeira etapa definida: Login navega diretamente para Home, sem validação. Definir autenticação em uma etapa futura; não instalar/configurar Firebase automaticamente.
- Dados de produtos, orçamentos e vendas continuam fictícios nesta fase, salvo nova decisão explícita.
- Menu inferior implementado: Hoje (Home), Produtos, Orçamentos e Venda. Login fora do menu; cadastro de produto abre sobre as abas. Orçamentos e Venda ainda mostram aviso de funcionalidade em desenvolvimento.
- Combinar com Ferrari quando você assume Login.js, evitando edições simultâneas.
- Combinar com o time os campos e as funções comuns antes de integrar as views.
- Conferir as imagens referenciadas por app.json antes de rodar o app. Se faltarem, combinar a correção mínima.

## 4. Começo sugerido

### Passo 1 — Conferir o estado atual

Leia os AGENTS.md aplicáveis, package.json, app.json, as rotas e o diff.
A pasta do app é MisterGestao/, dentro da raiz Git. Não confunda as duas pastas.
Estado após a entrega de 16/10/2026: index.tsx abre Login; Entrar usa router.replace para /home. Já existem _layout.tsx com Stack e home.tsx para a Home. Sessão, autenticação e proteção de rotas ainda não existem. Confira o código e o diff ao retomar.
Não sobrescreva mudanças locais, não recrie o Expo e não atualize o SDK para iniciar o trabalho.

### Passo 2 — Navegação inicial entregue; sessão futura

Use Expo Router, já instalado. Rotas ficam em src/app/ e views em src/view/.
Prepare somente as rotas necessárias à entrega atual, sem criar todas antecipadamente.

Arquivos candidatos, relativos ao app, criados ou alterados somente quando necessários:

- src/data/dados.js: usuário demonstrativo e funções diretas de dados.
- src/context/AppContext.js: sessão; produtos e carrinho entram quando forem usados.
- src/app/_layout.tsx: layout, provider e controle de acesso.
- src/app/index.tsx: entrada do app conforme a sessão.
- src/app/home.tsx: rota pequena para a Home existente.
- src/view/Login.js: integração após a passagem de Ferrari.

A implementação exata depende da decisão de autenticação e da documentação da versão instalada. Faça um arquivo por alteração combinada.
Nesta entrega, lint e TypeScript passaram sem avisos. Falta registrar o teste no celular: abrir Login e tocar em Entrar com campos vazios para chegar à Home.
Testes de credencial inválida, sair e acesso sem sessão serão feitos quando a autenticação/sessão entrar no escopo.

### Passo 3 — Liberar a integração dos colegas

Disponibilize somente o necessário para as telas em andamento:

- Produtos comuns com os campos e valores acordados.
- Função de cadastro e atualização da lista compartilhada.
- Carrinho único com adicionar, alterar quantidade e remover.
- Consulta de orçamentos e abertura por ID quando esse fluxo existir.

Nomes possíveis: listarProdutos, salvarProduto, salvarOrcamento e listarOrcamentos. Confira o código atual antes de criar; esses nomes não provam que as funções já existem.
Comunique o contrato ao colega: de onde importar, quais argumentos enviar e qual retorno/erro esperar. Mantenha tudo simples; não crie camadas genéricas.

### Passo 4 — Construir o fluxo prioritário

Ordem: Carrinho → Detalhe do orçamento → Compartilhar → integração da lista de salvos de Ferrari.
Trabalhe nas views e nas rotas correspondentes em incrementos separados.
Compartilhamento começa por texto; imagem exige uma solução compatível, discutida antes de instalar dependências.
Valide o fluxo completo com produtos e Home de Danner.

### Passo 5 — Venda, recibo e scanner

Depois do fluxo de orçamento aprovado: Nova venda → Finalizar venda → Recibo.
Scanner entra depois de o fluxo manual funcionar. Persistência local e Firebase são etapas próprias, com escopo definido antes de instalar/configurar.

## 5. Regras que você precisa garantir

- Dinheiro em centavos inteiros. Total = subtotal − desconto + frete.
- Quantidade inteira e positiva; o mesmo produto ocupa uma linha no carrinho.
- Desconto entre zero e subtotal; frete não negativo.
- Gerar, salvar ou compartilhar orçamento não baixa nem reserva estoque.
- Orçamento salvo conserva uma cópia dos itens e preços apresentados ao cliente.
- Na conversão, conferir validade, status e disponibilidade novamente.
- Não converter orçamento cancelado, vencido ou já convertido.
- Somente confirmar a venda baixa estoque; impedir duplicidade por dois toques.
- Na fase mock, os controles são locais. Integração entre aparelhos exige validação e operação atômica na etapa de banco.
- Sem persistência aprovada, os dados podem reiniciar ao recarregar o app. Avise o time.
- Login demonstrativo não é autenticação real. Compartilhamento não é envio automático. Recibo demonstrativo não é nota fiscal.

## 6. Como coordenar o time

Ferrari trabalha em ferrari; Danner em danner. Confirme o estado das branches antes de integrar.
Você concentra src/app/, src/data/ e src/context/ para reduzir conflitos. Colegas só alteram esses locais após combinar.
Receba a entrega com arquivos alterados, teste manual, resultados dos checks e pendências.
Revise o diff e teste o fluxo entre as telas antes de integrar na main. Não publique nem faça push automaticamente.
Depois de integrar mudanças comuns, avise os colegas para combinarem a atualização das branches sem perder trabalho local.
Marque TODO.md somente com evidência; diferencie visual pronto de integração pronta.

## 7. Prompts para usar com IA

Para começar:

> Leia docs/Pandini.md, docs/TODO.md, o guia geral e todos os AGENTS.md aplicáveis. Confira package.json, git status, diff e rotas atuais sem editar. Sou Pandini, tech lead. A navegação inicial Login → Home já foi implementada sem validação; sessão e autenticação ainda não existem. Quero conferir o estado atual e escolher o próximo incremento, preservando as telas de Ferrari e Danner. Liste as decisões pendentes e proponha a menor alteração em um único arquivo. Não instale dependências, não configure Firebase e espere minha aprovação.

Para executar um incremento:

> Estamos na etapa [etapa]. Quero alterar somente [arquivo] para [resultado]. Confira o código atual e a documentação correspondente à versão instalada antes de usar APIs. Proponha a alteração e espere aprovação. Depois, explique o diff, rode as verificações aplicáveis e indique um teste manual e as dependências que ainda faltam.

Para revisar uma entrega:

> Revise o diff de [branch/entrega] sem editar nem integrar. Confira o guia do responsável, mudanças fora do escopo, dependências em rotas/dados e falhas no fluxo. Separe problemas reais de sugestões opcionais. Não faça commit, merge ou push sem pedido explícito.

Para trabalhar nas regras:

> Analise a etapa [carrinho/orçamento/venda] e proponha um incremento simples. Confira centavos, quantidades, desconto/frete, preservação dos preços, estoque e repetição de confirmação quando aplicável. Não implemente Firebase nem funcionalidades de etapas futuras. Espere aprovação para um único arquivo.

## 8. Checklist de cada incremento

- [ ] Escopo e arquivo combinados; diff anterior preservado.
- [ ] Documentação da versão instalada consultada quando aplicável.
- [ ] npm run lint e npx tsc --noEmit executados na pasta do app; falhas anteriores e novas identificadas.
- [ ] Teste manual específico realizado, informando web ou celular.
- [ ] Teclado, compartilhamento e câmera validados no aparelho quando entrarem no escopo.
- [ ] Pendências e contratos comunicados ao colega afetado.
- [ ] TODO.md atualizado somente para o que foi realmente validado.
