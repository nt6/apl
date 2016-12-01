//generated code, do not edit
var examples=[
  ["rho-iota","⍝  ⍳ n  generates a list of numbers from 0 to n-1\n⍝  n n ⍴ A  arranges the elements of A in an n×n matrix\n5 5 ⍴ ⍳ 25"],
  ["mult","⍝ Multiplication table\n⍝  a × b    scalar multiplication, \"a times b\"\n⍝  ∘.       is the \"outer product\" operator\n⍝  A ∘.× B  every item in A times every item in B\n(⍳ 10) ∘.× ⍳ 10"],
  ["sierpinski","⍝ Sierpinski's triangle\n\n⍝ It's a recursively defined figure.\n⍝ We will use the following definition:\n⍝\n⍝   * the Sierpinski triangle of rank 0 is a one-by-one matrix 'X'\n⍝\n⍝   * if S is the triangle of rank n, then rank n+1 would be\n⍝     the two-dimensional catenation:\n⍝             S 0\n⍝             S S\n⍝     where \"0\" is an all-blank matrix same size as S.\n\nf ← {(⍵,(⍴⍵)⍴0)⍪⍵,⍵}\nS ← {' #'[(f⍣⍵) 1 1 ⍴ 1]}\nS 5"],
  ["primes","\n(1=+⌿0=A∘.∣A)/A←2↓⍳100"],
  ["life","⍝ Conway's game of life\n\n⍝ This example was inspired by the impressive demo at\n⍝ http://www.youtube.com/watch?v=a9xAKttWgP4\n\n⍝ Create a matrix:\n⍝     0 1 1\n⍝     1 1 0\n⍝     0 1 0\ncreature ← (3 3 ⍴ ⍳ 9) ∊ 1 2 3 4 7   ⍝ Original creature from demo\ncreature ← (3 3 ⍴ ⍳ 9) ∊ 1 3 6 7 8   ⍝ Glider\n\n⍝ Place the creature on a larger board, near the centre\nboard ← ¯1 ⊖ ¯2 ⌽ 5 7 ↑ creature\n\n⍝ A function to move from one generation to the next\nlife ← {⊃1 ⍵ ∨.∧ 3 4 = +/ +⌿ 1 0 ¯1 ∘.⊖ 1 0 ¯1 ⌽¨ ⊂⍵}\n\n⍝ Compute n-th generation and format it as a\n⍝ character matrix\ngen ← {' #'[(life ⍣ ⍵) board]}\n\n⍝ Show first three generations\n(gen 1) (gen 2) (gen 3)"],
  ["rule30","⍝ See https://en.wikipedia.org/wiki/Rule_30\n\nrule←30\nn←50 ⍝ number of rows to compute\nt←⌽rule⊤⍨8⍴2\n' #'[⊃⌽{⍵,⍨⊂t[2⊥¨3,/0,0,⍨↑⍵]}⍣n⊂z,1,z←n⍴0]"],
  ["queens","queens←{                            ⍝ The N-queens problem.\n\n    search←{                        ⍝ Search for all solutions.\n        (⊂⍬)∊⍵:0⍴⊂⍬                 ⍝ stitched: abandon this branch.\n        0=⍴⍵:rmdups ⍺               ⍝ all done: solution!\n        (hd tl)←(↑⍵)(1↓⍵)           ⍝ head 'n tail of remaining ranks.\n        next←⍺∘,¨hd                 ⍝ possible next steps.\n        rems←hd free¨⊂tl            ⍝ unchecked squares.\n        ⊃,/next ∇¨rems              ⍝ ... in following ranks.\n    }\n\n    cvex←(1+⍳⍵)×⊂¯1 0 1             ⍝ Checking vectors.\n\n    free←{⍵~¨⍺+(⍴⍵)↑cvex}           ⍝ Unchecked squares.\n\n    rmdups←{                        ⍝ Ignore duplicate solution.\n        rots←{{⍒⍵}\\4/⊂⍵}            ⍝ 4 rotations.\n        refs←{{⍋⍵}\\2/⊂⍵}            ⍝ 2 reflections.\n        best←{(↑⍋⊃⍵)⊃⍵}             ⍝ best (=lowest) solution.\n        all8←,⊃refs¨rots ⍵          ⍝ all 8 orientations.\n        (⍵≡best all8)⊃⍬(,⊂⍵)        ⍝ ignore if not best.\n    }\n\n    fmt←{                           ⍝ Format solution.\n        chars←'·⍟'[(⊃⍵)∘.=⍳⍺]       ⍝ char array of placed queens.\n        expd←1↓,⊃⍺⍴⊂0 1             ⍝ expansion mask.\n        ⊃¨↓↓expd\\chars              ⍝ vector of char matrices.\n    }\n\n    squares←(⊂⍳⌈⍵÷2),1↓⍵⍴⊂⍳⍵        ⍝ initial squares\n\n    ⍵ fmt ⍬ search squares          ⍝ all distinct solutions.\n}\nqueens 5"],
  ["mandelbrot","\n' #'[9>|⊃{⍺+⍵*2}/9⍴⊂¯3×.7j.5-⍉a∘.+0j1×a←(⍳n+1)÷n←98]"]
];
