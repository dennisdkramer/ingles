# Lesson 10 (kids) — design (Pass A, double lesson)

`band: kids · L10 · C10 · registers: 2b (friends and classmates) · 2a (a teacher) · contexts: classroom English, school subjects, words on the board`

## Fundamental idea taken from the parent `designs/lesson10.design.md`
A ideia do pai: o aluno **encontra uma palavra que nunca viu e consegue uma aposta defensável sobre como ela soa** — e depois confere sozinho, sem professor por perto. Para isso precisa de três coisas: os **pares que traem brasileiros** (*ship/sheep, three/tree, hat/hot, west/vest*), o **mapa das consoantes que o português nunca treinou** (TH, R, H, NG, L escuro, T de flap) e a **chave** (sílabas, sílaba forte, vogal dormindo, versão cuidada × versão natural). Kids mantêm a ideia e trocam a reunião pela **sala de aula**: palavras do quadro, nomes de matérias, o que o professor fala rápido.

## Core (what the student can do afterwards)
1. Olhar uma palavra nunca vista e fazer uma **aposta defensável** sobre o som — e conferir sem perguntar a ninguém.
2. Dizer em voz alta os **pares que traem** brasileiros, e ouvir a diferença quando voltam rápido: *ship/sheep · three/tree · hat/hot · west/vest*.
3. Escolher o som certo das consoantes que o português não treinou: **TH** (língua fora), **R**, **H**, **NG**, **L** escuro, **T** de flap.
4. Ler a **chave**: sílabas, a sílaba forte, a vogal dormindo (*schwa*) e a diferença entre a versão cuidada e a natural.

## Teaching beats (per core item) and dependencies
- **Vogal longa × curta é a primeira fratura:** *ship* (curto, boca relaxada) × *sheep* (longo, boca esticada). O português não usa duração para diferenciar palavras, então isto é **ouvido**, não leitura.
- **Consoante que existe em português mas com outro lugar na boca:** *T/D* com a língua nos dentes (TH), *R* americano (língua não toca o céu da boca), *H* soprado, *NG* sem o *g*, *L* final escuro (*milk*), *T* de flap entre vogais (*water*, já ouvido na aula 8).
- **A chave é a ferramenta de independência:** `·` separa sílabas, cinza = letra que a boca pula, e a sílaba forte vai em **MAIÚSCULAS**. **Dependência:** a chave só motiva quando destrava palavras que o aluno precisa — por isso ela vem **depois** dos pares e da clínica.
- **A vogal dormindo** (*schwa*) é o que faz *"banana"* soar *b'NAH-n'*: uma sílaba forte e o resto quase sem voz. É o segredo da versão natural.
- **Campo destravado pela chave:** *board, subject, science, history, geography, library, homework, answer, listen, question* — palavras da escola em que a chave realmente ajuda.

## Situation
O aluno está na sala e o professor escreve uma palavra nova no quadro — sem tempo de perguntar. Ele aposta no som, e depois confere com o áudio da página. Na escola, a mesma cena acontece com o nome das matérias e com as instruções que o professor fala rápido.

## Candidates (three channels)
- **Heard — o jogo dos pares.** Duas palavras aparecem (*ship* e *sheep*); uma é falada; o aluno acerta a que ouviu. Oito rodadas, os erros voltam no fim.
- **Done — a clínica.** Seis palavras reais da vida escolar; cada uma recebe um diagnóstico: qual som é o risco, o que a boca faz, e uma gravação antes/depois.
- **Read — o enigma.** Dez palavras desconhecidas + a chave; o aluno decide a pronúncia e confere no áudio.

## Chosen
**Os três, nesta ordem: pares → clínica → enigma.** Ouvido primeiro (é a única parte de escuta pura e a que o aluno repete por diversão), depois as palavras dele (é o que faz a explicação da boca valer a leitura), depois a chave como ferramenta que o torna independente.

**First 30 seconds:** duas palavras na tela, uma falada, sem texto de regra — o aluno age antes de qualquer ensino.

## What the student produces (evidence)
As escolhas dos pares (como qualquer exercício), uma linha de diagnóstico por palavra da clínica, lacunas que leem a chave, três palavras gravadas antes/depois, e um quiz sobre os quatro comportamentos — sem reutilizar item dos pares.


## Conflicts, and how I resolved them
- **Um jogo é Tier 1 (`shootPair`) e depende de `engine3.js`.** Resolution: nesta aula os oito pares vêm como **listen-and-tick** comuns (mesmo comportamento, mesma persistência), porque o motor de jogo não faz parte do que esta página carrega. Registrado: se o motor for ligado depois, os oito itens entram verbatim dentro do `.game`, e a resposta certa continua inferida do `data-say`.
- **Aula dupla com bloco de largura total.** Resolution: os pares ocupam um painel próprio de largura total; o resto segue os blocos normais.
- **Uma entrada que junta vogais + consoantes + chave.** Resolution: é por isso que a aula é **dupla**; os três compartilham um artefato só, a chave.
- **Stress não é marcado pelo `PronKey.render()` do site.** Resolution: na página a sílaba forte aparece em **MAIÚSCULAS**, e a página diz isso com todas as letras — não se afirma que a chave marca a batida.
- **TH, R e flap T já foram tocados nas aulas 5-9.** Resolution: esta aula é a **dona** do mapa de consoantes e diz isso; as anteriores só ouviram.

## Shape of the session (what is met, in what order)
1. **Os pares** — entrada pelo ouvido: duas palavras, uma falada, sem regra.
2. **O mapa das vogais** — curta × longa, e o que a boca faz.
3. **O mapa das consoantes** — TH, R, H, NG, L escuro, T de flap.
4. **A chave** — sílabas, sílaba forte, vogal dormindo, cuidada × natural.
5. **A clínica** — seis palavras da escola, com diagnóstico e gravação.
6. **O enigma** — decodificar com a chave, depois conferir no áudio.
7. **Treino** — pares, diagnóstico, chave, gravação.
8. **Quiz — sem consulta.**

## Notes for the build pass
English nas instruções e nos exercícios; português só nas explicações de posição da boca e no contraste "você diz X → diga Y". Cada item tem áudio (`data-say`) — sem áudio esta aula não vale nada. A chave é descrita **como o site a renderiza**.

`recycles:` lesson 8's flap T and the clock (heard); lesson 9's *th* voiced × voiceless pair; lesson 2's cognate code; lesson 1's short forms.
`must not re-teach:` lesson 4 owns *-s*; lesson 8 owns flap T (heard only); lesson 9 owns voiced *th*; the vowel map here is the **long × short** decision, not spelling rules.
