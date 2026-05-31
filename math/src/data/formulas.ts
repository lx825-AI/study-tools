import type { FormulaMap } from './types';

const formulaData: FormulaMap = {
  // ===== 高等数学 =====
  'calc-limit': {
    id: 'calc-limit',
    title: '函数与极限',
    subject: '高等数学',
    formulas: [
      {
        name: '第一个重要极限',
        latex: '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1',
        note: '必考！可变形为 lim_{x→0} x/sin x = 1，lim_{x→0} tan x/x = 1。',
        detail: '推导思路：用单位圆面积夹逼。sinx < x < tanx → cosx < sinx/x < 1 → 取极限得 1。常考变形：lim(x→0) sin(ax)/bx = a/b，lim(x→0) tanx/x = 1，lim(x→0) (1-cosx)/x² = 1/2。注意必须是 x→0 时才成立！',
        level: 'important',
      },
      {
        name: '第二个重要极限',
        latex: '\\lim_{x \\to \\infty} \\left(1 + \\frac{1}{x}\\right)^x = e \\quad\\text{或}\\quad \\lim_{x \\to 0} (1+x)^{\\frac{1}{x}} = e',
        note: '必考！1^∞ 型极限的核心工具，常配合取对数使用。',
        detail: '1^∞ 不定型的标准解法：设 y = (1+f(x))^g(x)，则 lim y = exp(lim g(x)·f(x))。前提是 f(x)→0 且 g(x)→∞。关键步骤：凑出 (1+□)^(1/□) 的形式，指数部分单独求极限。常见坑：底数必须是 1+无穷小，指数必须是无穷大，缺一不可。',
        level: 'important',
      },
      {
        name: '等价无穷小替换（x→0）',
        latex: '\\begin{aligned} &\\sin x \\sim x,\\ \\tan x \\sim x,\\ \\arcsin x \\sim x,\\ \\arctan x \\sim x \\ &1-\\cos x \\sim \\frac{x^2}{2},\\ \\ln(1+x) \\sim x,\\ e^x-1 \\sim x \\ &(1+x)^a-1 \\sim ax,\\ a^x-1 \\sim x\\ln a \\end{aligned}',
        note: '必考！仅限乘除法中使用，加减法中不可直接替换。',
        detail: '经典错误：lim(x→0) (tanx - sinx)/x³ 中直接把 tanx 和 sinx 都替换成 x，分子变 0 得极限 0——错误！正确做法：tanx - sinx = tanx(1-cosx) ~ x·x²/2 = x³/2，极限为 1/2。加减法中只有同阶抵消后才可替换高阶项。记住：乘除放心换，加减要谨慎。',
        level: 'important',
      },
      {
        name: '洛必达法则使用条件',
        latex: '\\lim \\frac{f(x)}{g(x)} \\text{ 为 } \\frac{0}{0} \\text{ 或 } \\frac{\\infty}{\\infty} \\text{ 型，且 } \\lim \\frac{f\'(x)}{g\'(x)} \\text{ 存在，则 } \\lim \\frac{f(x)}{g(x)} = \\lim \\frac{f\'(x)}{g\'(x)}',
        note: '0/0 或 ∞/∞ 型才可用！每次使用前必须验证条件。可反复使用。',
        detail: '三大使用前提缺一不可：①必须是 0/0 或 ∞/∞ 型；②分子分母在去心邻域内可导；③求导后的极限存在（或为 ∞）。每次用完都要重新检查是否仍满足条件。常见陷阱：非不定型直接用会出错，比如 lim(x→0) x/sinx 已经是 1，不需要洛必达。若洛必达后极限不存在（震荡），不能反推原极限不存在——需要换方法。',
      },
      {
        name: '函数连续的定义',
        latex: 'f(x) \\text{ 在 } x_0 \\text{ 连续} \\iff \\lim_{x \\to x_0} f(x) = f(x_0)',
        note: '三要素：f(x₀) 有定义、极限存在、极限值等于函数值。',
        detail: '等价表述：Δx→0 时 Δy→0。初等函数在其定义域内处处连续。分段函数在分段点处需要单独验证左右连续性。常考题型：已知分段函数在某点连续，求参数值 → 左极限 = 右极限 = 函数值，列方程解参数。',
      },
      {
        name: '间断点分类',
        latex: '\\begin{aligned} &\\text{第一类：} \\lim_{x \\to x_0^-} f(x) \\text{ 和 } \\lim_{x \\to x_0^+} f(x) \\text{ 均存在} \\\\ &\\text{第二类：至少一个单侧极限不存在} \\end{aligned}',
        note: '第一类又分可去（左右极限相等≠函数值）和跳跃（左右极限不等）。',
        detail: '可去间断点：左右极限相等但不等于函数值（或函数在该点无定义），重新定义该点函数值即可消除间断。跳跃间断点：左右极限都存在但不相等，差值 = 跳跃度。第二类间断点常见例子：x=0 是 y=1/x 的无穷间断点，x=0 是 y=sin(1/x) 的振荡间断点。考试常给分段函数，要求判断间断点类型。',
      },
      {
        name: '零点定理',
        latex: 'f \\in C[a,b],\\ f(a) \\cdot f(b) < 0 \\Rightarrow \\exists \\xi \\in (a,b),\\ f(\\xi) = 0',
        note: '证明方程根存在的首选工具。注意必须连续且两端异号。',
        detail: '证明方程 f(x)=0 在区间内有根的万能工具。使用步骤：①验证 f 在 [a,b] 上连续；②计算 f(a) 和 f(b)；③若异号则必有根。若同号不能直接断定无根（可能有偶数个根）。常配合单调性证明根的唯一性：先证明存在（零点定理），再证明单调（导数恒正/恒负），结论：存在唯一根。',
      },
      {
        name: '夹逼准则（三明治定理）',
        latex: 'a_n \\leq b_n \\leq c_n,\\ \\lim_{n \\to \\infty} a_n = \\lim_{n \\to \\infty} c_n = A \\ \\Rightarrow \\lim_{n \\to \\infty} b_n = A',
        note: '函数形式：g(x)≤f(x)≤h(x) 且 g,h→A，则 f→A。第一个重要极限的证明基础。',
        detail: '夹逼准则的核心思想：如果一个量被两个趋于相同极限的量"夹在中间"，它也必须趋于该极限。典型应用：①证明 lim(x→0) sinx/x = 1（单位圆面积夹逼）；②求 n 项和的极限，放大缩小后两边极限相同。函数形式：若在 x₀ 附近 g(x)≤f(x)≤h(x) 且 lim g = lim h = A，则 lim f = A。注意：不等式不需要对所有 n 成立，只需"最终成立"（存在 N，当 n>N 时成立）。常与单调有界准则对比使用：夹逼准则需要上下界趋于同一极限，单调有界准则只需要单调性和有界性。',
      },
      {
        name: '单调有界准则',
        latex: '\\{a_n\\} \\text{ 单调递增且有上界} \\Rightarrow \\lim_{n \\to \\infty} a_n \\text{ 存在（收敛）}',
        note: '数列收敛的充分条件（非必要）。单调递减有下界同理。常配合递推公式使用。',
        detail: '两个方向：①单调递增 + 有上界 ⇒ 收敛；②单调递减 + 有下界 ⇒ 收敛。这是实数完备性的等价表述之一。典型题型：已知 a₁=1, a_{n+1}=√(2+a_n)，证 {a_n} 收敛并求极限。步骤：①数学归纳法证单调（如 a_{n+1}>a_n）；②数学归纳法证有界（如 a_n<2）；③由单调有界准则知极限存在；④设 lim a_n = L，对递推式取极限得 L=√(2+L)，解之。关键：必须先证明极限存在，才能设极限为 L！',
      },
    ],
  },

  'calc-derivative': {
    id: 'calc-derivative',
    title: '导数与微分',
    subject: '高等数学',
    formulas: [
      {
        name: '导数定义（两点式）',
        latex: 'f\'(x_0) = \\lim_{\\Delta x \\to 0} \\frac{f(x_0+\\Delta x)-f(x_0)}{\\Delta x} = \\lim_{x \\to x_0} \\frac{f(x)-f(x_0)}{x-x_0}',
        note: '定义法求导、判断可导性的根本。可导 ⇒ 连续，反之不成立。',
        detail: '两种等价形式：Δx 形式（增量式）和 x→x₀ 形式（两点式）。题目给 f\'(x₀) 的具体值，求某个极限 → 凑导数定义。典型题：已知 f\'(x₀)=A，求 lim(h→0)[f(x₀+2h)-f(x₀-h)]/h = 3A。分段函数在分段点的可导性必须用定义分别求左右导数。',
      },
      {
        name: '基本初等函数求导公式',
        latex: '\\begin{aligned} &(C)\' = 0,\\ (x^n)\' = nx^{n-1},\\ (e^x)\' = e^x,\\ (a^x)\' = a^x\\ln a \\ &(\\ln x)\' = \\frac{1}{x},\\ (\\log_a x)\' = \\frac{1}{x\\ln a} \\ &(\\sin x)\' = \\cos x,\\ (\\cos x)\' = -\\sin x,\\ (\\tan x)\' = \\sec^2 x \\ &(\\arcsin x)\' = \\frac{1}{\\sqrt{1-x^2}},\\ (\\arctan x)\' = \\frac{1}{1+x^2} \\end{aligned}',
        note: '必须滚瓜烂熟，所有求导题的基础。注意 ln|x| 的导数也是 1/x。',
        detail: '记忆技巧：①指数函数求导后还是自己（eˣ 完全不变，aˣ 多乘 ln a）；②三角函数的导数循环：sin→cos→-sin→-cos→sin；③反三角函数的导数分母都有 √ 或 1+x²，特别注意 arcsin 和 arccos 差一个负号；④对数求导 ln|x| 的导数 = 1/x（含绝对值也一样）。',
      },
      {
        name: '四则运算 + 链式法则',
        latex: '\\begin{aligned} (u \\pm v)\' &= u\' \\pm v\' \\\\ (uv)\' &= u\'v + uv\' \\\\ \\left(\\frac{u}{v}\\right)\' &= \\frac{u\'v - uv\'}{v^2} \\\\ [f(g(x))]\' &= f\'(g(x)) \\cdot g\'(x) \\end{aligned}',
        note: '链式法则 = "从外到内，层层求导再相乘"。复合函数求导必用。',
        detail: '链式法则是求导出错的重灾区。核心：先对外层函数求导（自变量位置代入内层函数），再乘以内层函数的导数。多层复合如 sin(ln(x²+1))：外层 cos(·)、中层 1/(·)、内层 2x，三项连乘。乘积法则的坑：(uv)\' ≠ u\'v\'，必须分别求导再相加。',
      },
      {
        name: '隐函数求导',
        latex: 'F(x,y)=0 \\ \\text{两边同时对 } x \\text{ 求导，注意 } y \\text{ 是 } x \\text{ 的函数，} \\frac{dy}{dx} = -\\frac{F_x}{F_y}',
        note: '对 y 求导时乘 dy/dx，最后解出 dy/dx。F_y ≠ 0 时才可用公式。',
        detail: '两种方法：①方程两边同时对 x 求导，遇到 y 就乘 dy/dx，最后移项解出；②公式法 dy/dx = -F_x/F_y（F 是移项后的二元函数）。方法①更通用，方法②更快但要注意符号。经典题：e^y + xy - e = 0 在 (0,1) 处的导数。',
      },
      {
        name: '参数方程求导',
        latex: '\\begin{cases} x = x(t) \\\\ y = y(t) \\end{cases} \\Rightarrow \\frac{dy}{dx} = \\frac{dy/dt}{dx/dt},\\quad \\frac{d^2y}{dx^2} = \\frac{d(y\')/dt}{dx/dt}',
        note: '一阶导：y 对 t 的导数除以 x 对 t 的导数。二阶导：对一阶导再求一次。',
        detail: '最容易错的是二阶导！dy/dx 是 t 的函数，二阶导 d²y/dx² = d(dy/dx)/dx = [d(dy/dx)/dt] ÷ [dx/dt]，不是直接对 dy/dx 再对 t 求导。一阶导的几何意义是切线斜率，二阶导与凹凸性有关。常考题型：求切线方程、求曲率。',
      },
      {
        name: '莱布尼茨公式（高阶导）',
        latex: '(uv)^{(n)} = \\sum_{k=0}^{n} \\binom{n}{k} u^{(n-k)} v^{(k)}',
        note: '类似二项式定理的结构！常用于两个函数乘积的 n 阶导数。',
        detail: '与 (a+b)^n 展开对比记忆：(u+v)\' 是一阶，(uv)^{(n)} 的系数正好是杨辉三角第 n 行。适用于 u 的高阶导好求（如多项式）、v 的高阶导也好求（如 eˣ, sinx）的乘积。常见题型：求 y = x²eˣ 的 n 阶导数。u=x² 三阶及以上导数为 0，n≥3 时只有前三项。',
      },
      {
        name: '渐近线（水平 / 垂直 / 斜）',
        latex: '\\begin{aligned} &\\text{水平：} \\lim_{x \\to \\pm\\infty} f(x) = A \\Rightarrow y = A \\\\ &\\text{垂直：} \\lim_{x \\to x_0} f(x) = \\infty \\Rightarrow x = x_0 \\\\ &\\text{斜：} k = \\lim_{x \\to \\pm\\infty} \\frac{f(x)}{x},\\ b = \\lim_{x \\to \\pm\\infty}[f(x)-kx] \\Rightarrow y = kx+b \\end{aligned}',
        note: '水平渐近线看 x→∞；垂直渐近线看分母为零/无定义点；斜渐近线先求 k 再求 b。',
        detail: '渐近线反映函数在"远处"的行为。水平渐近线（y=A）：lim(x→∞) f(x) 存在有限值。垂直渐近线（x=x₀）：在间断点或无定义点处函数趋于无穷。斜渐近线（y=kx+b）：当 lim f(x)/x = k ≠ 0 且 lim[f(x)-kx] = b 存在时有斜渐近线。注意：同一方向（x→+∞ 或 x→-∞）水平渐近线和斜渐近线不能同时存在——k≠0 时就没有水平渐近线。常考题型：给定 f(x) 求所有渐近线 → 分别检查 x→+∞, x→-∞, 和各间断点处。',
      },
      {
        name: '曲率与曲率半径',
        latex: 'K = \\frac{|y\'\'|}{(1+y\'^2)^{3/2}},\\quad R = \\frac{1}{K},\\quad \\text{参数式：} K = \\frac{|x\'y\'\' - x\'\'y\'|}{(x\'^2+y\'^2)^{3/2}}',
        note: '曲率 K 越大曲线越弯（直线 K=0，圆 K=1/R）。曲率半径 R=1/K。',
        detail: '曲率衡量曲线的弯曲程度 = 切线转角对弧长的变化率。直角坐标公式 K=|y\'\'|/(1+y\'²)^(3/2)。参数方程：K=|x\'y\'\'-x\'\'y\'|/(x\'²+y\'²)^(3/2)。直线曲率为 0（不弯），半径为 R 的圆曲率恒为 1/R（均匀弯曲）。曲率圆（密切圆）：在曲线某点处与曲线有相同一二阶导数的圆，圆心在法线方向上距该点 R 处。常考题：求曲线在指定点处的曲率和曲率半径，或求曲率最大的点。',
      },
    ],
  },

  'calc-mvt': {
    id: 'calc-mvt',
    title: '中值定理与泰勒',
    subject: '高等数学',
    formulas: [
      {
        name: '罗尔定理',
        latex: 'f \\in C[a,b] \\cap D(a,b),\\ f(a)=f(b) \\Rightarrow \\exists \\xi \\in (a,b),\\ f\'(\\xi)=0',
        note: '端点值相等则内部必有导数为零的点。证明题中构造辅助函数的依据。',
        detail: '三个条件缺一不可：闭区间连续、开区间可导、端点值相等。证明题核心技巧——构造辅助函数 F(x) 使 F(a)=F(b)，然后对 F 用罗尔定理。经典构造：要证 f\'(ξ)=k，构造 F(x)=f(x)-kx；要证 f\'(ξ)+p(ξ)f(ξ)=0，构造 F(x)=f(x)e^{∫p dx}。',
      },
      {
        name: '拉格朗日中值定理',
        latex: 'f \\in C[a,b] \\cap D(a,b) \\Rightarrow \\exists \\xi \\in (a,b),\\ f\'(\\xi) = \\frac{f(b)-f(a)}{b-a}',
        note: '最重要的中值定理！∣f(b)−f(a)∣ ≤ M∣b−a∣ 用于证明不等式。',
        detail: '几何意义：曲线在 (a,b) 内至少有一点切线平行于两端点连线。罗尔定理是其特例（f(a)=f(b) 时斜率为 0）。常用推论：若 f\'(x)≡0 则 f(x)≡常数；若 f\'(x)>0 则 f 严格递增。证明不等式时用 ∣f(b)-f(a)∣=∣f\'(ξ)∣·∣b-a∣≤M∣b-a∣。',
      },
      {
        name: '柯西中值定理',
        latex: 'f,g \\in C[a,b] \\cap D(a,b),\\ g\'(x) \\neq 0 \\Rightarrow \\exists \\xi \\in (a,b),\\ \\frac{f(b)-f(a)}{g(b)-g(a)} = \\frac{f\'(\\xi)}{g\'(\\xi)}',
        note: '拉格朗日的推广（取 g(x)=x 即得拉格朗日）。洛必达法则的证明基础。',
        detail: '两个函数"同步变化"的中值定理。参数方程视角：曲线 (g(t), f(t)) 上必有一点切线平行于两端点连线。证明洛必达法则的核心工具：处理 0/0 型时，f(a)=g(a)=0，直接套用柯西得 f/g = f\'/g\'。使用前提：g\'(x) 在 (a,b) 内恒不为零。',
      },
      {
        name: '泰勒公式（拉格朗日余项）',
        latex: 'f(x) = f(a) + f\'(a)(x-a) + \\frac{f\'\'(a)}{2!}(x-a)^2 + \\cdots + \\frac{f^{(n)}(a)}{n!}(x-a)^n + R_n(x)',
        note: '用多项式逼近函数。a=0 时为麦克劳林公式。常考 n 阶展开。',
        detail: '余项 R_n(x) = f^{(n+1)}(ξ)/(n+1)! · (x-a)^{n+1}，ξ 在 a 与 x 之间。选择展开阶数 n 的方法：题目要求精确到 x^n，则展开到 x^n 项（余项次数 > n 即可忽略）。a 的选取很关键——选离目标点近且函数值好算的点。常考点：求极限时展开到同阶，高阶项合并为 o(x^n)。',
      },
      {
        name: '常用麦克劳林展开式',
        latex: '\\begin{aligned} e^x &= 1 + x + \\frac{x^2}{2!} + \\frac{x^3}{3!} + o(x^3) \\ \\sin x &= x - \\frac{x^3}{3!} + \\frac{x^5}{5!} + o(x^5) \\ \\cos x &= 1 - \\frac{x^2}{2!} + \\frac{x^4}{4!} + o(x^4) \\ \\ln(1+x) &= x - \\frac{x^2}{2} + \\frac{x^3}{3} + o(x^3) \\ \\frac{1}{1-x} &= 1 + x + x^2 + x^3 + o(x^3) \\end{aligned}',
        note: '期末考试大题高频考点！求极限、证明不等式时直接展开。',
        detail: '记忆规律：①eˣ 全正、分母阶乘递增；②sinx 奇次项、正负交替、分母奇数阶乘；③cosx 偶次项、正负交替、分母偶数阶乘；④ln(1+x) 正负交替、分母无阶乘；⑤1/(1-x) 全正无阶乘即等比数列。求极限时展开到分子分母最低非零阶即可。常见组合：(1+x)^α = 1+αx+α(α-1)/2!·x²+... 也要记。',
      },
    ],
  },

  'calc-indef-integral': {
    id: 'calc-indef-integral',
    title: '不定积分',
    subject: '高等数学',
    formulas: [
      {
        name: '基本积分公式',
        latex: '\\begin{aligned} &\\int x^n dx = \\frac{x^{n+1}}{n+1}+C\\ (n \\neq -1),\\ \\int \\frac{1}{x}dx = \\ln|x|+C \\ &\\int e^x dx = e^x+C,\\ \\int a^x dx = \\frac{a^x}{\\ln a}+C \\ &\\int \\sin x\\,dx = -\\cos x+C,\\ \\int \\cos x\\,dx = \\sin x+C \\ &\\int \\frac{1}{1+x^2}dx = \\arctan x+C,\\ \\int \\frac{1}{\\sqrt{1-x^2}}dx = \\arcsin x+C \\end{aligned}',
        note: '反向记导数公式。注意 1/x 积分要加绝对值 ln|x|。',
        detail: '积分是求导的逆运算，每个求导公式反过来就是一个积分公式。最容易忘的两个：∫tanx dx = -ln|cosx|+C，∫secx dx = ln|secx+tanx|+C。注意 ∫1/x dx 必须加绝对值 ln|x|，因为 ln 定义域是正数。∫1/(a²+x²) dx = (1/a)arctan(x/a)+C 是 arctan 公式的推广。',
      },
      {
        name: '第一类换元法（凑微分）',
        latex: '\\int f(g(x))g\'(x)\\,dx = \\int f(u)\\,du,\\quad u=g(x)',
        note: '核心思想：把 g\'(x)dx 凑成 du。熟练后不用写 u，直接看出原函数。',
        detail: '本质是对复合函数求导的逆用。常见凑微分套路：①∫f(ax+b)dx → 凑 d(ax+b) = a dx；②∫f(x²)x dx → 凑 d(x²)=2x dx；③∫f(lnx)/x dx → 凑 d(lnx)=dx/x；④∫f(sinx)cosx dx → 凑 d(sinx)。技巧：先看被积函数中哪部分是另一部分的导数，那个就是你要凑的微分。',
      },
      {
        name: '第二类换元法（三角代换）',
        latex: '\\begin{aligned} &\\sqrt{a^2-x^2} \\to x = a\\sin t \\\\ &\\sqrt{a^2+x^2} \\to x = a\\tan t \\\\ &\\sqrt{x^2-a^2} \\to x = a\\sec t \\end{aligned}',
        note: '根号里有平方和/差时用三角代换去根号。别忘了换回原变量！',
        detail: '核心是利用恒等式去根号：①√(a²-x²) → 令 x=a sin t，则 √(a²-x²)=a|cos t|；②√(a²+x²) → 令 x=a tan t，利用 1+tan²t=sec²t；③√(x²-a²) → 令 x=a sec t，利用 sec²t-1=tan²t。最后一步必须把 t 换回 x：画参考三角形，用边长比写出 sin/cos/tan 等在 x 下的表达式。',
      },
      {
        name: '分部积分法',
        latex: '\\int u\\,dv = uv - \\int v\\,du',
        note: '口诀"反对幂指三"：反三角→对数→幂函数→指数→三角，排前面的作 u。',
        detail: '选 u 的原则：求导后变简单的优先作 u（反三角、对数求导后变代数函数）；求导后不变的作 dv（指数函数）。经典题型：①∫x eˣ dx：u=x（幂），dv=eˣdx → 用一次分部即得；②∫x²sinx dx：需要两次分部，注意符号循环；③∫eˣ sinx dx：两次分部后出现原积分，移项解方程即得。',
      },
      {
        name: '有理函数积分',
        latex: '\\frac{P(x)}{Q(x)} \\xrightarrow{\\text{分解}} \\sum \\left[ \\frac{A}{(x-a)^k} + \\frac{Bx+C}{(x^2+px+q)^m} \\right]',
        note: '真分式分解为部分分式之和。分母因式分解后待定系数法求参数。',
        detail: '步骤：①若分子次数≥分母，先做多项式除法化为真分式；②分母因式分解为一次因式和不可约二次因式的乘积；③按规则设部分分式形式（k 重因式对应 k 项）；④通分后比较分子系数或用赋值法求待定系数。一次因式的积分得 ln，二次因式的积分配方后得 arctan 和 ln 的组合。',
      },
    ],
  },

  'calc-def-integral': {
    id: 'calc-def-integral',
    title: '定积分与应用',
    subject: '高等数学',
    formulas: [
      {
        name: '牛顿-莱布尼茨公式',
        latex: '\\int_a^b f(x)\\,dx = F(b) - F(a),\\quad F\'(x) = f(x)',
        note: '整个积分学的核心！先求原函数再代入上下限。',
        detail: '这是连接定积分与不定积分的桥梁。使用前提：f 在 [a,b] 上连续，F 是 f 的任意一个原函数。注意如果 f 有间断点或无穷间断，不能直接套公式，需要分段处理或用反常积分。计算定积分的一般思路：先看奇偶性简化区间，再求不定积分，最后代上下限相减。',
      },
      {
        name: '对称区间奇偶性',
        latex: '\\int_{-a}^a f(x)\\,dx = \\begin{cases} 0 & f \\text{ 是奇函数} \\\\ 2\\int_0^a f(x)\\,dx & f \\text{ 是偶函数} \\end{cases}',
        note: '选择题/填空题神器，先看奇偶性能省大量计算。',
        detail: '解题第一步：看到对称区间 [-a,a] 先判断被积函数奇偶性。奇函数直接写 0，偶函数折半积分。常见奇函数：sinx、tanx、x³、xcosx；常见偶函数：cosx、x²、|x|、e^{x²}。注意：被积函数是乘积形式时，奇×奇=偶，奇×偶=奇。有时需要拆分被积函数为奇部+偶部分别处理。',
      },
      {
        name: '平面图形面积',
        latex: 'S = \\int_a^b |f(x) - g(x)|\\,dx \\quad\\text{或}\\quad S = \\int_\\alpha^\\beta \\frac{1}{2}r^2(\\theta)\\,d\\theta',
        note: '直角坐标：上方减下方再积分。极坐标：1/2 ∫ r² dθ。注意分段。',
        detail: '直角坐标下关键步骤：①画图确定积分区域；②确定上下曲线（上减下）；③若两曲线有交点，以交点为界分段积分。极坐标用于心形线 r=a(1+cosθ)、双纽线 r²=a²cos2θ 等曲线围成的面积。最容易错：两条曲线围成的面积不是 ∫(f-g)² dx，而是 ∫[f(x)-g(x)] dx（一重积分，不是平方！）。',
      },
      {
        name: '旋转体体积',
        latex: '\\begin{aligned} &\\text{绕 } x \\text{ 轴：} V = \\pi\\int_a^b f^2(x)\\,dx \\\\ &\\text{绕 } y \\text{ 轴：} V = 2\\pi\\int_a^b x\\,f(x)\\,dx \\end{aligned}',
        note: '绕 x 轴用圆盘法（π∫y²dx），绕 y 轴用柱壳法（2π∫xy dx）。',
        detail: '圆盘法思路：垂直于旋转轴的每个截面是圆盘，面积 πr²×厚度=体积微元。柱壳法思路：平行于旋转轴的薄壳展开成矩形，周长 2πx×高度 f(x)×厚度 dx。选择方法的原则：绕 x 轴旋转，垂直于 x 轴切片（dx）用圆盘法；绕 y 轴旋转，宜用柱壳法。两曲线间的旋转体体积：V = π∫[f²(x)-g²(x)]dx。',
      },
      {
        name: '平面曲线弧长',
        latex: 's = \\int_a^b \\sqrt{1+[f\'(x)]^2}\\,dx \\quad\\text{参数式：}\\quad s = \\int_\\alpha^\\beta \\sqrt{[x\'(t)]^2+[y\'(t)]^2}\\,dt',
        note: '直角坐标和参数方程两种形式，极坐标也有对应公式。',
        detail: '弧长微元 ds = √(dx²+dy²)，三种表示：①直角 y=f(x)：ds = √(1+y\'²) dx；②参数方程：ds = √(x\'²+y\'²) dt；③极坐标 r=r(θ)：ds = √(r²+r\'²) dθ。常见考题：求摆线、圆的周长、悬链线弧长。注意积分前先化简被积表达式——三角恒等式经常能把根号消掉。',
      },
      {
        name: '反常积分敛散性',
        latex: '\\begin{aligned} &\\text{无穷限：} \\int_a^{+\\infty} f(x)\\,dx = \\lim_{b \\to +\\infty} \\int_a^b f(x)\\,dx \\\\ &\\text{瑕积分（}a \\text{ 为瑕点）：} \\int_a^b f(x)\\,dx = \\lim_{\\varepsilon \\to 0^+} \\int_{a+\\varepsilon}^b f(x)\\,dx \\end{aligned}',
        note: '反常积分 = 定积分 + 取极限。核心：∫₁^∞ 1/x^p dx 收敛 ⇔ p>1；∫₀¹ 1/x^p dx 收敛 ⇔ p<1。',
        detail: '反常积分与常规定积分的核心区别：积分区间无穷或因被积函数无界。求法：①先求原函数 F(x)；②代入上下限并取极限；③极限存在则收敛，否则发散。p-积分的两个基准：∫₁^∞ 1/x^p dx 在 p>1 收敛、p≤1 发散；∫₀¹ 1/x^p dx 在 p<1 收敛、p≥1 发散。比较判别法：若 0≤f(x)≤g(x)，g 收敛 ⇒ f 收敛，f 发散 ⇒ g 发散。极限比较法：若 lim f/g = L (0<L<∞)，则 f 与 g 同敛散。重要：必须先判断收敛性才能计算值，发散的反常积分没有值！',
      },
      {
        name: '旋转曲面侧面积',
        latex: '\\begin{aligned} &\\text{绕 } x \\text{ 轴：} S = 2\\pi\\int_a^b f(x)\\sqrt{1+[f\'(x)]^2}\\,dx \\\\ &\\text{绕 } y \\text{ 轴：} S = 2\\pi\\int_a^b x\\sqrt{1+[f\'(x)]^2}\\,dx \\end{aligned}',
        note: '侧面积 = 2π × 半径 × 弧长微元 ds。与体积对比：体积用 f² dx，侧面积用 f ds。',
        detail: '侧面积公式推导：曲线绕轴旋转，曲线上每段弧长微元 ds 扫出一个"圆环带"，面积 = 2π×(旋转半径)×ds。绕 x 轴旋转半径 = f(x)；绕 y 轴旋转半径 = x。参数方程形式：S = 2π∫ y(t)·√(x\'²+y\'²) dt（绕 x 轴）。常与体积、弧长结合出题：已知曲线方程，求绕轴旋转所得旋转体的体积和侧面积。容易出错：体积公式是 π∫r² dx，侧面积公式是 2π∫r·ds——主项不同（r² vs r），微元不同（dx vs ds）！',
      },
      {
        name: '积分中值定理',
        latex: 'f \\in C[a,b] \\Rightarrow \\exists \\xi \\in [a,b],\\ \\int_a^b f(x)\\,dx = f(\\xi)(b-a)',
        note: '积分版的拉格朗日中值定理。f(ξ) 就是 f 在 [a,b] 上的积分平均值。证明题常用。',
        detail: '几何意义：曲线 f(x) 下方面积 = 以 f(ξ) 为高、(b-a) 为宽的矩形面积。其中 f(ξ) = (1/(b-a))∫_a^b f(x)dx 即 f 在 [a,b] 上的连续平均值。推广：若 f 连续、g 在 [a,b] 上不变号，则 ∃ξ∈[a,b] 使 ∫ fg dx = f(ξ)∫ g dx。证明思路：利用 f 在闭区间上的最大最小值 M,m，由 m ≤ f(x) ≤ M 得 m(b-a) ≤ ∫f ≤ M(b-a)，再用介值定理得结论。常考：证明含定积分的不等式或等式中存在性命题。',
      },
    ],
  },

  'calc-ode': {
    id: 'calc-ode',
    title: '微分方程',
    subject: '高等数学',
    formulas: [
      {
        name: '可分离变量方程',
        latex: '\\frac{dy}{dx} = f(x)g(y) \\Rightarrow \\int \\frac{dy}{g(y)} = \\int f(x)\\,dx',
        note: '把含 y 的放一边、含 x 的放一边，分别积分即得通解。',
        detail: '解法三步：①分离变量——把所有含 y 的移到 dy 侧、含 x 的移到 dx 侧；②两边同时积分（别忘了积分常数 C）；③化简得通解。陷阱：分离时 g(y)=0 对应的常数解 y≡y₀ 可能是奇解（不在通解中），需要单独验证是否丢失。考试中若题目给初始条件，最后代入定 C。',
      },
      {
        name: '一阶线性微分方程',
        latex: 'y\' + P(x)y = Q(x) \\Rightarrow y = e^{-\\int P dx}\\left[ \\int Q\\,e^{\\int P dx}\\,dx + C \\right]',
        note: '必背通解公式！e^{∫Pdx} 是积分因子，Q=0 时为齐次方程。',
        detail: '标准形式必须是 y\' + P(x)y = Q(x)（y\' 系数为 1，P(x) 是 y 的系数，Q(x) 在等式右边）。通解 = e^{-∫Pdx}[∫Q·e^{∫Pdx}dx + C]，其中 e^{∫Pdx} 称为积分因子。齐次情况（Q=0）：通解 y = Ce^{-∫Pdx}。常考方程如 y\'+y/x=sinx，注意 P(x)=1/x→∫Pdx=ln|x|→积分因子=x。',
      },
      {
        name: '二阶常系数齐次线性方程',
        latex: 'y\'\' + py\' + qy = 0 \\xrightarrow{\\lambda^2+p\\lambda+q=0} \\begin{cases} \\Delta>0: y=C_1 e^{\\lambda_1 x}+C_2 e^{\\lambda_2 x} \\\\ \\Delta=0: y=(C_1+C_2 x)e^{\\lambda x} \\\\ \\Delta<0: y=e^{\\alpha x}(C_1\\cos\\beta x+C_2\\sin\\beta x) \\end{cases}',
        note: '先写特征方程，根据判别式 Δ 分三种情况。λ = α ± iβ。',
        detail: '解法：将 y\'\'→λ²、y\'→λ、y→1 代入得特征方程 λ²+pλ+q=0。Δ>0 两不等实根→指数解；Δ=0 重根→乘 x 得第二个线性无关解；Δ<0 共轭复根 λ=α±iβ→e^{αx}(C₁cosβx+C₂sinβx)。注意：复根情况下 α 是实部（决定增减趋势），β 是虚部（决定振荡频率）。若题目给初始条件 y(0) 和 y\'(0)，代入通解求 C₁,C₂。',
      },
      {
        name: '二阶常系数非齐次特解形式',
        latex: '\\begin{aligned} &f(x) = P_m(x)e^{\\mu x}:\\ y^* = x^k Q_m(x)e^{\\mu x} \\\\ &f(x) = e^{\\alpha x}[P\\cos\\beta x + Q\\sin\\beta x]:\\ y^* = x^k e^{\\alpha x}[R\\cos\\beta x + S\\sin\\beta x] \\end{aligned}',
        note: 'k 由 μ(或 α±iβ) 是特征根的重数决定：不是根 k=0，单根 k=1，重根 k=2。',
        detail: '待定系数法求特解的完整流程：①写出对应齐次方程的特征根；②根据 f(x) 的形式确定特解类型；③判断 μ（或 α±iβ）是否是特征根，决定 x^k 的 k 值；④设特解（含待定系数），代入原方程比较系数求出各参数。通解 = 齐次通解 + 非齐次特解。叠加原理：若 f(x)=f₁(x)+f₂(x)，可分别求特解再加起来。',
      },
      {
        name: '伯努利方程',
        latex: 'y\' + P(x)y = Q(x)y^n \\ (n \\neq 0,1) \\xrightarrow{z = y^{1-n}} z\' + (1-n)P(x)z = (1-n)Q(x)',
        note: '非线性 → 线性：令 z=y^{1-n}，化为一阶线性方程用通解公式。注意 n=0 是线性、n=1 是可分离。',
        detail: '伯努利方程是少数可解析求解的非线性一阶方程。标准形式：y\' + P(x)y = Q(x)y^n。解法三步：①令 z = y^{1-n}，求导得 z\' = (1-n)y^{-n}·y\'；②原方程两边同乘 (1-n)y^{-n}，替换后得 z\' + (1-n)Pz = (1-n)Q（一阶线性！）；③用一阶线性通解公式求 z，最后代回 y = z^{1/(1-n)}。陷阱：n>0 时 y≡0 总是方程的解（可能是奇解，不一定包含在通解中），需单独验证。常考：判断方程类型并选择合适解法。',
      },
    ],
  },

  'calc-ode-advanced': {
    id: 'calc-ode-advanced',
    title: '微分方程进阶',
    subject: '高等数学',
    formulas: [
      {
        name: '可降阶的高阶方程（y\'\'=f(x) 型）',
        latex: 'y^{(n)} = f(x) \\Rightarrow \\text{连续积分 } n \\text{ 次，每次加一个积分常数}',
        note: '最简形式，直接逐次积分。如 y\'\'=sinx → y\'=-cosx+C₁ → y=-sinx+C₁x+C₂。',
        detail: '不显含 y 和低阶导数的方程：y^{(n)}=f(x)。直接对 x 积分 n 次，每次积分产生一个独立常数。例如 y\'\'=6x：积分一次得 y\'=3x²+C₁，再积分得 y=x³+C₁x+C₂。这是高阶方程中最简单的情形——不需要任何技巧，只需逐次积分。考试中常需要代入初始条件（如 y(0)=a, y\'(0)=b）确定常数。',
        level: 'basic',
      },
      {
        name: '可降阶方程（不显含 y 型）',
        latex: 'y\'\' = f(x, y\') \\xrightarrow{p=y\'} p\' = f(x, p) \\ \\text{（关于 } p \\text{ 的一阶方程）}',
        note: '令 p=y\'，则 y\'\'=p\'。方程降为关于 p 的一阶方程。解出 p 后再积分得 y。',
        detail: '不显含 y 的方程：F(x, y\', y\'\')=0。解法：①令 p=y\'，则 y\'\'=p\'=dp/dx；②代入得关于 x 和 p 的一阶方程 F(x,p,p\')=0；③解此一阶方程得 p=φ(x,C₁)；④积分 y=∫p dx+C₂。经典例题：y\'\'=y\'+x（令 p=y\' 得 p\'-p=x，一阶线性方程）。注意：解出 p 后务必再积分一次得 y。',
        level: 'important',
      },
      {
        name: '可降阶方程（不显含 x 型）',
        latex: 'y\'\' = f(y, y\') \\xrightarrow{p=y\',\\ y\'\'=p\\frac{dp}{dy}} p\\frac{dp}{dy} = f(y, p)',
        note: '令 p=y\'，关键变换：y\'\'=dp/dx=(dp/dy)(dy/dx)=p·dp/dy。方程降为 y 和 p 的一阶方程。',
        detail: '不显含自变量 x 的方程：F(y, y\', y\'\')=0。关键步骤：令 p=y\'，则 y\'\' = dp/dx = (dp/dy)(dy/dx) = p·dp/dy（链式法则）。代入得关于 y 和 p 的一阶方程 F(y, p, p·dp/dy)=0。解出 p=ψ(y,C₁) 后，再由 dy/dx = ψ(y,C₁)（可分离变量）积分得隐式通解。经典例题：y·y\'\'=(y\')²。',
        level: 'important',
      },
      {
        name: '欧拉方程（Euler）',
        latex: 'x^ny^{(n)} + a_1 x^{n-1}y^{(n-1)} + \\cdots + a_ny = f(x) \\xrightarrow{x=e^t} \\text{常系数线性方程}',
        note: '令 x=e^t（或 t=ln x），x·y\'→y\'_t，x²y\'\'→y\'\'_t - y\'_t。化为常系数！',
        detail: '欧拉方程的特征：各项是 x^k·y^{(k)} 的形式，系数为常数。解法：令 x=e^t (x>0)，则 x·dy/dx = dy/dt，x²·d²y/dx² = d²y/dt² - dy/dt。变换后原方程变为关于 t 的常系数线性方程，用特征方程法求解。最终将 t=ln x 代回。若 x<0 则令 x=-e^t。考试中通常只需处理 x>0 的情况。二阶欧拉方程：x²y\'\'+ax·y\'+by=f(x) 是最常考形式。',
        level: 'advanced',
      },
      {
        name: '常系数线性微分方程组',
        latex: '\\begin{cases} x\' = a_{11}x + a_{12}y \\\\ y\' = a_{21}x + a_{22}y \\end{cases} \\xrightarrow{|A-\\lambda I|=0} \\text{通解 = } C_1 e^{\\lambda_1 t}\\mathbf{v}_1 + C_2 e^{\\lambda_2 t}\\mathbf{v}_2',
        note: '写为矩阵形式 X\'=AX。特征值和特征向量 → 通解。方法与常系数方程完全对应。',
        detail: '一阶常系数线性方程组 X\'=AX 的解法与单个方程类似，但用矩阵形式。步骤：①写系数矩阵 A；②求特征方程 |A-λI|=0 的根 λ₁,λ₂；③求每个 λ_i 对应的特征向量 v_i；④通解 X = C₁e^{λ₁t}v₁ + C₂e^{λ₂t}v₂。复特征根情形：λ=α±iβ → e^{αt}[C₁(cosβt·Re(v)-sinβt·Im(v)) + C₂(…)]。应用背景：①耦合振子（弹簧系统）；②种群竞争模型（Lotka-Volterra）；③电路中的 RLC 网络。',
        level: 'advanced',
      },
    ],
  },

  'calc-multi-diff': {
    id: 'calc-multi-diff',
    title: '多元函数微分',
    subject: '高等数学',
    formulas: [
      {
        name: '偏导数定义',
        latex: 'f_x(x_0,y_0) = \\lim_{\\Delta x \\to 0} \\frac{f(x_0+\\Delta x, y_0)-f(x_0,y_0)}{\\Delta x}',
        note: '对 x 求偏导时把 y 视为常数，对 y 求偏导时把 x 视为常数。',
        detail: '偏导是一元导数的自然推广：固定其他变量，只对一个变量求导。计算技巧与一元导数完全一样，只是其他变量当作常数。重要区别：一元函数可导⇒连续，但多元函数偏导存在不能推出连续！典型反例：f(x,y)=xy/(x²+y²) (补充 f(0,0)=0) 在 (0,0) 偏导存在但不连续。',
      },
      {
        name: '全微分',
        latex: 'dz = \\frac{\\partial z}{\\partial x}dx + \\frac{\\partial z}{\\partial y}dy',
        note: '偏导存在且偏导连续 ⇒ 全微分存在。可微 ⇒ 偏导存在、函数连续、方向导数存在。',
        detail: '全微分的几何意义：曲面在一点处的切平面方程。偏导连续 ⇒ 可微（充分非必要条件，偏导连续则可微，但可微不能推出偏导连续）。可微 ⇔ 全增量 Δz = f_x·Δx + f_y·Δy + o(ρ)，其中 ρ=√(Δx²+Δy²)。全微分用于近似计算：Δz ≈ dz = f_x·Δx + f_y·Δy。命题重点：可微、偏导存在、偏导连续、方向导数存在四者之间的关系。可微是最强的条件之一。',
      },
      {
        name: '多元复合函数链式法则',
        latex: 'z = f(u,v),\\ u=u(x,y),\\ v=v(x,y) \\Rightarrow \\frac{\\partial z}{\\partial x} = \\frac{\\partial z}{\\partial u}\\frac{\\partial u}{\\partial x} + \\frac{\\partial z}{\\partial v}\\frac{\\partial v}{\\partial x}',
        note: '画变量关系图！每条路径相乘、多条路径相加。',
        detail: '核心方法——画树形图：从 z 出发，到每个中间变量（u,v）画分支，再从每个中间变量到自变量（x,y）画分支。z→x 的每条完整路径对应一个偏导乘积项，所有路径求和。常见变体：①z=f(u,v) 且 u,v 只依赖于 t → dz/dt = ∂z/∂u·du/dt + ∂z/∂v·dv/dt（全导数）；②z=f(x,u(x,y)) → ∂z/∂x = ∂f/∂x + ∂f/∂u·∂u/∂x（注意区分 f 对第一个变量 x 的偏导和最终 ∂z/∂x）。',
      },
      {
        name: '隐函数求偏导',
        latex: 'F(x,y,z)=0 \\Rightarrow \\frac{\\partial z}{\\partial x} = -\\frac{F_x}{F_z},\\quad \\frac{\\partial z}{\\partial y} = -\\frac{F_y}{F_z}',
        note: '公式法最快。注意 F_z ≠ 0。',
        detail: '公式法步骤：①将方程写成 F(x,y,z)=0 的形式（全部移到一边）；②分别求 F_x, F_y, F_z（把 x,y,z 当作独立变量求偏导）；③代入公式 ∂z/∂x = -F_x/F_z。注意符号：分子分母都有负号吗？只有分子有负号！另外，求 F_x 时 y 和 z 都视为常数，求 F_z 时 x 和 y 视为常数。F_z≠0 是隐函数存在的前提。',
      },
      {
        name: '方向导数与梯度',
        latex: '\\frac{\\partial f}{\\partial \\mathbf{l}} = \\nabla f \\cdot \\mathbf{l}_0 = f_x\\cos\\alpha + f_y\\cos\\beta + f_z\\cos\\gamma',
        note: '梯度方向是函数增长最快的方向，梯度模长是最大方向导数。',
        detail: '方向导数 = 梯度 · 单位方向向量 = |∇f|·cosθ，其中 θ 是梯度与方向 l 的夹角。重要结论：①沿梯度方向 (θ=0) 方向导数最大 = |∇f|；②沿负梯度方向减小最快；③垂直于梯度方向 (θ=90°) 方向导数为 0。注意：方向向量必须先单位化！给方向 l=(a,b)，单位方向 l₀=(a,b)/√(a²+b²)。',
      },
      {
        name: '拉格朗日乘数法',
        latex: '\\text{求 } f(x,y) \\text{ 在 } g(x,y)=0 \\text{ 下的最值：}\\ L(x,y,\\lambda) = f(x,y) + \\lambda g(x,y)',
        note: '分别对 x,y,λ 求偏导令其为零，解方程组。多个约束条件就多个 λ。',
        detail: '用于条件极值（约束优化）。步骤：①构造拉格朗日函数 L = f + λg（注意是 +λg 还是 -λg，两种写法等价只是 λ 符号不同）；②对每个自变量求偏导并令为 0，再加 ∂L/∂λ = g = 0（即约束条件本身）；③解方程组得候选点；④比较各候选点的函数值确定最值。几何意义：在最值点处 ∇f 与 ∇g 平行（等高线与约束曲线相切）。',
      },
      {
        name: '二元函数极值判别',
        latex: '\\begin{aligned} &A = f_{xx},\\ B = f_{xy},\\ C = f_{yy} \\\\ &AC-B^2 > 0 \\begin{cases} A>0 & \\text{极小值} \\\\ A<0 & \\text{极大值} \\end{cases} \\\\ &AC-B^2 < 0 \\Rightarrow \\text{非极值（鞍点）} \\end{aligned}',
        note: '先求驻点（偏导=0），再用判别式。AC−B²=0 时不确定，需另判。',
        detail: '判别式 Δ = AC-B² 实际上是 Hessian 矩阵的行列式，决定了驻点处函数的局部形状。步骤：①解 f_x=0, f_y=0 得所有驻点；②对每个驻点计算 A=f_xx, B=f_xy, C=f_yy；③用判别式。AC-B²>0 时该点为极值点（A>0 极小，A<0 极大）；AC-B²<0 时为鞍点（马鞍面形状）；AC-B²=0 判别法失效，需用定义或其他方法判断。',
      },
    ],
  },

  'calc-double-int': {
    id: 'calc-double-int',
    title: '二重积分',
    subject: '高等数学',
    formulas: [
      {
        name: '直角坐标化为二次积分',
        latex: '\\iint_D f(x,y)\\,dxdy = \\int_a^b dx \\int_{y_1(x)}^{y_2(x)} f(x,y)\\,dy',
        note: '先画积分区域图！确定是 X 型还是 Y 型区域，定限从"入"到"出"。',
        detail: 'X 型区域：作垂直于 x 轴的直线穿越区域，下边界 y₁(x) 为下限，上边界 y₂(x) 为上限，x 范围 [a,b] 为外层积分限。Y 型区域类似。选型的技巧：哪种型让内层积分好算就选哪种。常见陷阱：如果边界曲线分段定义，需要把区域拆成多个子区域分别积分再求和。口诀：画图画画再画图，区域不清楚一切白搭。',
      },
      {
        name: '极坐标变换',
        latex: '\\iint_D f(x,y)\\,dxdy = \\int_\\alpha^\\beta d\\theta \\int_0^{r(\\theta)} f(r\\cos\\theta, r\\sin\\theta)\\,r\\,dr',
        note: '被积函数含 x²+y² 或积分区域为圆/扇形时用极坐标。乘 r 别忘了！',
        detail: '变换要点：①x = r cosθ, y = r sinθ；②面积微元 dxdy → r dr dθ（最容易漏乘 r！）；③积分区域含圆 x²+y²≤R² 或环形 a²≤x²+y²≤b² 时优先考虑极坐标；④被积函数含 x²+y² 项时，换为 r² 后往往能简化。θ 的范围根据区域覆盖的弧度角决定，r 的范围从原点到边界——从"内边界"到"外边界"。',
      },
      {
        name: '交换积分次序',
        latex: '\\int_a^b dx \\int_{y_1(x)}^{y_2(x)} f\\,dy = \\int_c^d dy \\int_{x_1(y)}^{x_2(y)} f\\,dx',
        note: '原次序难积时尝试交换。先画积分区域，根据图形重新定限。',
        detail: '当内层积分无法用初等函数表示时（如 ∫e^{x²}dx、∫sinx/x dx），交换次序往往是唯一出路。步骤：①根据原积分限画出积分区域 D；②换一个方向看区域，确定新的积分限（X 型↔Y 型互换）；③写出新次序的二次积分并计算。注意交换后外层限必须是常数，内层限可以是外层变量的函数。',
      },
      {
        name: '二重积分对称性',
        latex: '\\begin{aligned} &D \\text{ 关于 } x \\text{ 轴对称：} \\iint_D y\\,d\\sigma = 0 \\\\ &D \\text{ 关于 } y \\text{ 轴对称：} \\iint_D x\\,d\\sigma = 0 \\end{aligned}',
        note: '奇函数在对称区域上积分为零，偶函数可折半。省计算的神器。',
        detail: '对称性判断方法：①D 关于 x 轴对称，被积函数中 y 是奇次幂（如 y¹, y³, sin y）则积分为 0；y 是偶次幂（如 y², cos y）则积分 = 2×上半区域积分。②D 关于 y 轴对称同理处理 x。③若 D 关于原点对称，判断 f(x,y) 关于 (x,y)→(-x,-y) 的奇偶性。尤其注意：区域对称但被积函数不对称时不能简化！',
      },
    ],
  },

  'calc-series': {
    id: 'calc-series',
    title: '无穷级数',
    subject: '高等数学',
    formulas: [
      {
        name: '几何级数（等比级数）',
        latex: '\\sum_{n=0}^{\\infty} ar^n = \\frac{a}{1-r},\\quad |r| < 1',
        note: '最基础的级数，∣r∣ ≥ 1 发散。和函数题的首选对照对象。',
        detail: '这是所有级数中最基础也是最重要的。和函数 S(x)=a/(1-r)，其中 a 是首项，r 是公比。关键变形：①∑x^n 收敛区间 (-1,1)，和 = 1/(1-x)；②∑n·x^{n-1} = 1/(1-x)²（可通过逐项求导得到）；③∑x^n/n = -ln(1-x)。求幂级数和函数时，核心思路就是通过逐项积分/求导将原级数转化为几何级数形式。',
      },
      {
        name: 'p-级数',
        latex: '\\sum_{n=1}^{\\infty} \\frac{1}{n^p}\\ \\begin{cases} \\text{收敛} & p > 1 \\\\ \\text{发散} & p \\leq 1 \\end{cases}',
        note: '比较判别法的基准。p=1 是调和级数（发散），p=2 和为 π²/6。',
        detail: 'p-级数是正项级数比较判别法的"标尺"——任何级数的收敛性都可以通过与 p-级数比较来判断。记忆：p>1 收敛，p≤1 发散。p=1（调和级数）是临界情况，虽然通项趋于 0 但发散（重要反例：通项趋于 0 不一定收敛！）。对数 p-级数 ∑1/[n(ln n)^p] 的临界值也是 p>1 收敛。',
      },
      {
        name: '正项级数三大判别法',
        latex: '\\begin{aligned} &\\text{比较：} a_n \\leq C b_n,\\ \\sum b_n \\text{ 收敛} \\Rightarrow \\sum a_n \\text{ 收敛} \\\\[8pt] &\\text{比值：} \\lim \\frac{a_{n+1}}{a_n} = \\rho \\begin{cases} <1 & \\text{收敛} \\\\ >1 & \\text{发散} \\end{cases} \\\\[8pt] &\\text{根值：} \\lim \\sqrt[n]{a_n} = \\rho \\begin{cases} <1 & \\text{收敛} \\\\ >1 & \\text{发散} \\end{cases} \\end{aligned}',
        note: '比值法适合含阶乘/指数；根值法适合含 n 次方。ρ=1 时都失效。',
        detail: '选择技巧：①含 n! 必用比值法（比值可消阶乘）；②含 a^n 用比值或根值均可，根值法更直接（开 n 次方消指数）；③含 n^p 型用比较法与 p-级数对照；④极限比较法：lim(a_n/b_n)=L(0<L<∞) 则两级数同敛散。ρ=1 时比值/根值失效是常见坑点，此时需要用比较法或积分判别法。',
      },
      {
        name: '交错级数 — 莱布尼茨判别法',
        latex: '\\sum (-1)^{n-1} a_n,\\ a_n \\geq 0:\\ a_n \\text{ 单调递减且 } \\lim a_n = 0 \\Rightarrow \\text{收敛}',
        note: '两个条件都要满足！收敛时余项 |R_n| ≤ a_{n+1}。',
        detail: '两个条件缺一不可：①a_n 单调递减（最终递减即可）；②lim a_n = 0。如果单调递减不成立，级数可能发散。典型例子：∑(-1)^n/n 收敛（条件收敛），∑(-1)^n/√n 收敛但更慢。重要区分：莱布尼茨判别法只能判"收敛"，不能判绝对收敛还是条件收敛——需要再加绝对值后用正项级数判别法判断。余项估计 |R_n|≤a_{n+1} 非常实用。',
      },
      {
        name: '幂级数收敛半径与收敛域',
        latex: 'R = \\lim_{n \\to \\infty} \\left|\\frac{a_n}{a_{n+1}}\\right| \\quad\\text{（或根值法）}\\quad \\text{收敛区间 } (-R, R)',
        note: '求出 R 后务必检查端点 x=±R 处的收敛性，才能写出完整收敛域。',
        detail: '收敛半径 R 公式：R = lim|a_n/a_{n+1}| 或 R = 1/lim|a_n|^{1/n}。收敛区间 (-R,R) 内部绝对收敛。关键步骤——端点判断：将 x=±R 分别代入原级数，用正项级数或交错级数判别法判断收敛性，从而确定收敛域是开区间、闭区间还是半开半闭。例如 ∑x^n/n：R=1，x=1 发散（调和），x=-1 收敛（交错调和），收敛域 [-1,1)。',
      },
      {
        name: '幂级数求和函数',
        latex: '\\sum a_n x^n \\xrightarrow{\\text{逐项积分/求导}} \\text{已知和函数}\\ \\xrightarrow{\\text{还原}} S(x)',
        note: '常用技巧：逐项求导消分母系数，逐项积分消分子系数。收敛域不变。',
        detail: '求和函数的通用策略——化归为已知和（通常化为几何级数或其变体）。技巧：①系数含 1/n → 先逐项求导消分母，求和后再逐项积分还原；②系数含 n → 先逐项积分消分子 n，求和后再逐项求导还原；③拆分通项为几个已知级数之和。重要性质：逐项求导和逐项积分不改变收敛半径（但可能改变端点收敛性）。注意还原时别忘了加积分常数（通常需要利用 S(0) 确定）。',
      },
      {
        name: '傅里叶级数（周期 2π）',
        latex: '\\begin{aligned} f(x) &= \\frac{a_0}{2} + \\sum_{n=1}^{\\infty} (a_n\\cos nx + b_n\\sin nx) \\\\ a_n &= \\frac{1}{\\pi}\\int_{-\\pi}^{\\pi} f(x)\\cos nx\\,dx,\\quad b_n = \\frac{1}{\\pi}\\int_{-\\pi}^{\\pi} f(x)\\sin nx\\,dx \\end{aligned}',
        note: '周期函数展开为三角级数。奇函数只有正弦项（a_n=0），偶函数只有余弦项（b_n=0）。',
        detail: '傅里叶级数的核心：在 [-π,π] 上满足狄利克雷条件的函数可展开为三角级数。狄利克雷充分条件：f 在 [-π,π] 上分段单调且只有有限个第一类间断点，则傅里叶级数收敛于 [f(x+)+f(x-)]/2。奇偶延拓技巧：①f 为奇函数 → a_n=0，得傅里叶正弦级数；②f 为偶函数 → b_n=0，得傅里叶余弦级数。对于周期 2L 的函数：积分区间 [-L,L]，基频 nπx/L。注意：傅里叶级数在间断点处收敛于左右极限的平均值——这是常考点！',
      },
      {
        name: '绝对收敛与条件收敛',
        latex: '\\begin{aligned} &\\sum |a_n| \\text{ 收敛} \\Rightarrow \\sum a_n \\text{ 绝对收敛} \\Rightarrow \\text{重排后和不变} \\\\ &\\sum a_n \\text{ 收敛但 } \\sum |a_n| \\text{ 发散} \\Rightarrow \\sum a_n \\text{ 条件收敛} \\end{aligned}',
        note: '绝对收敛可任意交换求和顺序；条件收敛重排后和可能改变（黎曼重排定理）。',
        detail: '判定流程：①先对通项加绝对值，用正项级数判别法判断 Σ|a_n|；②若 Σ|a_n| 收敛 → 原级数绝对收敛（最强等级）；③若 Σ|a_n| 发散但原级数收敛（如用莱布尼茨法）→ 条件收敛。性质差异：绝对收敛级数可以任意重排而不改变和值；条件收敛级数通过适当重排可以收敛到任意实数！典型对比：Σ(-1)^n/n 条件收敛，Σ(-1)^n/n² 绝对收敛。常考：给定级数判断是绝对收敛、条件收敛还是发散。',
      },
    ],
  },

  'calc-curve-integral': {
    id: 'calc-curve-integral',
    title: '曲线积分与格林公式',
    subject: '高等数学',
    formulas: [
      {
        name: '第一类曲线积分（对弧长）',
        latex: '\\int_L f(x,y)\\,ds = \\int_\\alpha^\\beta f(x(t),y(t)) \\sqrt{[x\'(t)]^2+[y\'(t)]^2}\\,dt',
        note: '弧长微元 ds = √(dx²+dy²)。积分值与方向无关（对称性可用于简化）。',
        detail: '对弧长的曲线积分（标量积分）计算步骤：①写出曲线参数方程；②计算弧长微元 ds=√(x\'²+y\'²)dt；③代入积分。性质：与积分路径方向无关（∫_L fds = ∫_{-L} fds）。常见应用：求曲线质量（线密度×弧长）、曲线质心。记忆口诀："沿着曲线走，每段弧长乘以函数值求和"。计算技巧：若曲线对称且 f 是奇函数，可利用对称性简化。圆形边界用极坐标参数化更方便。',
        level: 'important',
      },
      {
        name: '第二类曲线积分（对坐标）',
        latex: '\\int_L P(x,y)\\,dx + Q(x,y)\\,dy = \\int_\\alpha^\\beta \\left[P\\,x\'(t) + Q\\,y\'(t)\\right]dt',
        note: '变力沿曲线做功的数学表达。积分值与方向有关：反向积分变号！',
        detail: '第二类曲线积分表示变力 F=(P,Q) 沿曲线 L 做的功。关键性质：方向性——∫_{-L} = -∫_L（反向积分变号）。计算步骤：①将曲线参数化；②代入 P,Q 和 dx=x\'dt, dy=y\'dt；③化为对 t 的定积分。注意 dx, dy 的正负号！若曲线由方程 y=y(x) 给出，可直接以 x 为参数。两类曲线积分可通过 cos 方向角互化：∫_L Pdx+Qdy = ∫_L (P cosα + Q cosβ) ds。',
        level: 'important',
      },
      {
        name: '格林公式（Green）',
        latex: '\\oint_L P\\,dx + Q\\,dy = \\iint_D \\left(\\frac{\\partial Q}{\\partial x} - \\frac{\\partial P}{\\partial y}\\right)dx\\,dy',
        note: '封闭曲线积分 ↔ 二重积分！L 取正向（逆时针，内部在左侧）。计算面积：A = ½∮ xdy - ydx。',
        detail: '格林公式是曲线积分计算的核心工具——将封闭曲线积分转化为区域内的二重积分。条件：①L 是封闭光滑曲线；②P,Q 在 D 内有一阶连续偏导；③L 取正向（逆时针——沿 L 走时区域 D 在左手边）。应用场景：①封闭曲线积分直接算二重积分；②非封闭曲线可通过补线变成封闭再减补线；③计算平面区域面积：A = ∬_D 1 dxdy = ½∮_L xdy-ydx = ∮_L xdy = -∮_L ydx。重要推论：若 ∂Q/∂x = ∂P/∂y（积分与路径无关），则沿任意闭曲线的积分为 0。',
        level: 'important',
      },
      {
        name: '曲线积分与路径无关的条件',
        latex: '\\frac{\\partial P}{\\partial y} = \\frac{\\partial Q}{\\partial x} \\text{（在单连通域 } D \\text{ 内成立）} \\Rightarrow \\int_L P\\,dx+Q\\,dy \\text{ 与路径无关}',
        note: '∂P/∂y = ∂Q/∂x 且 D 单连通 → 积分只与起点终点有关！可求原函数 u(x,y)。',
        detail: '四个等价条件（在单连通域内）：①∂P/∂y = ∂Q/∂x；②沿 D 内任意闭曲线积分为 0；③积分 ∫_L Pdx+Qdy 只与起终点有关；④存在 u(x,y) 使得 du = Pdx+Qdy（即 P=∂u/∂x, Q=∂u/∂y）。求原函数方法：①偏积分法：u=∫Pdx+φ(y)，再对 y 求导确定 φ\'；②线积分法（选简便路径）：u(x,y)=∫_{(x₀,y₀)}^{(x,y)} Pdx+Qdy，可沿折线积分。注意"单连通"是关键——有洞的区域不适用！',
        level: 'important',
      },
      {
        name: '斯托克斯公式（Stokes）',
        latex: '\\oint_L P\\,dx+Q\\,dy+R\\,dz = \\iint_\\Sigma \\begin{vmatrix} \\cos\\alpha & \\cos\\beta & \\cos\\gamma \\\\ \\frac{\\partial}{\\partial x} & \\frac{\\partial}{\\partial y} & \\frac{\\partial}{\\partial z} \\\\ P & Q & R \\end{vmatrix} dS',
        note: '格林公式的三维推广：空间闭曲线积分 → 曲面积分。L 方向与 Σ 法向量满足右手定则。',
        detail: '斯托克斯公式是格林公式向三维空间的自然推广。行列式形式便于记忆——第一行是方向余弦，第三行是向量分量。右手定则：右手四指沿 L 方向弯曲，拇指指向 Σ 的正法向。注意曲面的侧/定向必须与曲线方向协调。退化情况：若曲面在 xy 平面上（z=0），Stokes 公式退化为格林公式。这是场论中旋度定理的基础形式。',
        level: 'advanced',
      },
      {
        name: '高斯公式（散度定理）',
        latex: '\\oiint_\\Sigma P\\,dydz + Q\\,dzdx + R\\,dxdy = \\iiint_\\Omega \\left(\\frac{\\partial P}{\\partial x} + \\frac{\\partial Q}{\\partial y} + \\frac{\\partial R}{\\partial z}\\right)dV',
        note: '封闭曲面积分 ↔ 三重积分！右侧被积函数是散度 div F。Σ 取外侧为正。',
        detail: '高斯公式（散度定理）是格林公式在三维空间的另一推广：将封闭曲面上的通量积分转化为体积分。条件：①Σ 是封闭光滑曲面；②P,Q,R 在 Ω 内有一阶连续偏导；③Σ 取外侧（法向量指向外部）。物理意义：通过封闭曲面的净通量 = 内部源的总和（散度的体积分）。应用：①直接计算封闭曲面积分；②非封闭曲面可先补面再用高斯公式；③求向量场的散度。这是电磁学、流体力学的基本定理。',
        level: 'advanced',
      },
    ],
  },

  'calc-triple-integral': {
    id: 'calc-triple-integral',
    title: '三重积分',
    subject: '高等数学',
    formulas: [
      {
        name: '直角坐标三重积分',
        latex: '\\iiint_\\Omega f(x,y,z)\\,dV = \\int_a^b dx \\int_{y_1(x)}^{y_2(x)} dy \\int_{z_1(x,y)}^{z_2(x,y)} f(x,y,z)\\,dz',
        note: '先对 z 积分（从下曲面到上曲面），再对 y（投影区域），最后对 x。顺序可换。',
        detail: '直角坐标系下三重积分化为三次积分（累次积分）。最常用顺序（先 z 后 y 后 x）：①将 Ω 向 xOy 面投影得 D_xy；②对每个 (x,y)∈D_xy，z 从下曲面 z₁(x,y) 到上曲面 z₂(x,y)；③在 D_xy 上做二重积分。换序原则与二重积分类似，关键是正确写出各变量的上下限。适合"柱体"型区域（上下为曲面、侧面为柱面）。',
        level: 'important',
      },
      {
        name: '柱坐标三重积分',
        latex: '\\iiint_\\Omega f\\,dV = \\iiint f(r\\cos\\theta, r\\sin\\theta, z)\\,r\\,dr\\,d\\theta\\,dz',
        note: 'x=r cosθ, y=r sinθ, z=z。雅可比行列式 = r（别忘了乘 r！）。适合圆柱、旋转抛物面。',
        detail: '柱坐标 = 极坐标 (r,θ) + 直角坐标 z。体积微元 dV = r dr dθ dz（来自二重积分极坐标的 r）。适用场景：①区域在 xy 面投影是圆/扇形；②被积函数含 x²+y² → 变为 r²。计算步骤：确定 θ 范围 → 确定 r 范围（可能依赖 z）→ 确定 z 范围。经典例题：计算抛物面 z=x²+y² 与平面 z=4 围成的体积。',
        level: 'important',
      },
      {
        name: '球坐标三重积分',
        latex: '\\iiint_\\Omega f\\,dV = \\iiint f(\\rho\\sin\\phi\\cos\\theta, \\rho\\sin\\phi\\sin\\theta, \\rho\\cos\\phi)\\,\\rho^2\\sin\\phi\\,d\\rho\\,d\\phi\\,d\\theta',
        note: '雅可比 = ρ² sinφ。x=ρ sinφ cosθ, y=ρ sinφ sinθ, z=ρ cosφ。适合球、锥体。',
        detail: '球坐标参数：ρ≥0（到原点距离），0≤φ≤π（与 z 轴正半轴夹角），0≤θ<2π（xOy 面方位角）。体积微元 dV = ρ² sinφ dρ dφ dθ。适用：区域是球体/球冠/锥体。经典题型：计算球体 x²+y²+z²≤R² 的体积 = 4πR³/3（用球坐标直接得到）。注意 φ 范围：若区域包含 z 轴正半轴附近，φ 从 0 开始；圆锥 z≥√(x²+y²) 对应 0≤φ≤π/4。',
        level: 'important',
      },
      {
        name: '三重积分换元（一般变量变换）',
        latex: '\\iiint_\\Omega f(x,y,z)\\,dxdydz = \\iiint_{\\Omega\'} f(x(u,v,w),y(u,v,w),z(u,v,w))\\,|J|\\,dudvdw',
        note: '雅可比行列式 J = ∂(x,y,z)/∂(u,v,w)。柱坐标 |J|=r，球坐标 |J|=ρ² sinφ。',
        detail: '一般变量变换 (x,y,z)→(u,v,w) 时，dxdydz = |J| dudvdw。雅可比矩阵是三阶矩阵，|J| 是其行列式的绝对值。柱坐标：x=r cosθ, y=r sinθ, z=z → |J| = r。球坐标：x=ρ sinφ cosθ, y=ρ sinφ sinθ, z=ρ cosφ → |J| = ρ² sinφ。应用场景：截面为椭圆的柱体（广义柱坐标）、旋转椭球体等。计算 |J| 时注意偏导顺序。',
        level: 'advanced',
      },
      {
        name: '三重积分对称性',
        latex: '\\begin{aligned} &\\Omega \\text{ 关于 } xOy \\text{ 面对称：} f \\text{ 关于 } z \\text{ 为奇} \\Rightarrow \\iiint f = 0 \\\\ &\\Omega \\text{ 关于 } xOy \\text{ 面对称：} f \\text{ 关于 } z \\text{ 为偶} \\Rightarrow \\iiint f = 2\\iiint_{\\Omega_{\\text{上}}} f \\end{aligned}',
        note: '与二重积分类似：奇函数在对称区域积分为零，偶函数 = 2 倍一半区域。',
        detail: '对称性是简化计算的重要技巧。使用前提：积分区域 Ω 具有对称性，且被积函数关于相应变量有确定的奇偶性。常见对称类型：①关于坐标平面对称（如 xOy 面）；②关于坐标轴对称（如 z 轴）；③轮换对称（x,y,z 互换后 Ω 不变）。轮换对称下：∭x²dV = ∭y²dV = ∭z²dV。解题时先观察区域和被积函数的对称性，可大幅减少计算甚至直接得出零。',
        level: 'important',
      },
    ],
  },

  'calc-surface-field': {
    id: 'calc-surface-field',
    title: '曲面积分与场论',
    subject: '高等数学',
    formulas: [
      {
        name: '第一类曲面积分（对面积）',
        latex: '\\iint_\\Sigma f(x,y,z)\\,dS = \\iint_{D_{xy}} f(x,y,z(x,y)) \\sqrt{1+z_x^2+z_y^2}\\,dxdy',
        note: '面积微元 dS = √(1+z_x²+z_y²) dxdy。也可向 xOz 或 yOz 面投影（注意雅可比不同）。',
        detail: '对面积的曲面积分（标量积分）计算步骤：①写出曲面方程（通常 z=z(x,y)）；②计算面积微元 dS = √(1+(∂z/∂x)²+(∂z/∂y)²) dxdy；③确定投影区域 D_xy；④化为二重积分。关键：若曲面向 yOz 面投影更方便（如圆柱面 x²+y²=R²），dS = √(1+x_y²+x_z²) dydz。常见应用：求曲面质量（面密度×面积）、曲面质心。',
        level: 'important',
      },
      {
        name: '第二类曲面积分（对坐标）',
        latex: '\\iint_\\Sigma P\\,dydz + Q\\,dzdx + R\\,dxdy = \\iint_\\Sigma (P\\cos\\alpha + Q\\cos\\beta + R\\cos\\gamma)\\,dS',
        note: '有向曲面上的向量场通量。积分值与曲面的侧（方向）有关——反向积分变号！',
        detail: '第二类曲面积分表示向量场 F=(P,Q,R) 通过有向曲面 Σ 的通量。计算步骤：①确定曲面的侧（上侧/下侧、前侧/后侧等）；②向坐标面投影（如 dxdy 项向 xOy 面投影）；③注意正负号：上侧取正，下侧取负。合矢量投影法：∬_Σ Pdydz+Qdzdx+Rdxdy = ∬_Σ (P cosα+Q cosβ+R cosγ) dS（cosα,cosβ,cosγ 是法向量的方向余弦）。关键区别：第一类与方向无关，第二类与方向有关（反向积分变号！）。',
        level: 'important',
      },
      {
        name: '梯度、散度与旋度',
        latex: '\\begin{aligned} &\\operatorname{grad} f = \\nabla f = \\left(\\frac{\\partial f}{\\partial x}, \\frac{\\partial f}{\\partial y}, \\frac{\\partial f}{\\partial z}\\right) \\\\ &\\operatorname{div} \\mathbf{F} = \\nabla \\cdot \\mathbf{F} = \\frac{\\partial P}{\\partial x} + \\frac{\\partial Q}{\\partial y} + \\frac{\\partial R}{\\partial z} \\\\ &\\operatorname{rot} \\mathbf{F} = \\nabla \\times \\mathbf{F} = \\begin{vmatrix} \\mathbf{i} & \\mathbf{j} & \\mathbf{k} \\\\ \\frac{\\partial}{\\partial x} & \\frac{\\partial}{\\partial y} & \\frac{\\partial}{\\partial z} \\\\ P & Q & R \\end{vmatrix} \\end{aligned}',
        note: '梯度指向函数增长最快的方向；散度衡量源的强度；旋度衡量旋转趋势。',
        detail: '梯度 grad f = (f_x, f_y, f_z)：标量场的方向导数最大化方向，指向 f 增长最快的方向。散度 div F = ∂P/∂x+∂Q/∂y+∂R/∂z：向量场在一点的"源"强度，div F>0 表示流出（源），div F<0 表示流入（汇），div F=0 称为无源场（管量场）。旋度 rot F：向量场在一点的旋转趋势，rot F=0 称为无旋场（保守场）。梯度场必无旋（rot(grad f) ≡ 0），旋度场必无散（div(rot F) ≡ 0）。',
        level: 'important',
      },
      {
        name: '保守场与势函数',
        latex: '\\mathbf{F} \\text{ 为保守场} \\iff \\operatorname{rot}\\mathbf{F} = \\mathbf{0} \\text{（单连通域）} \\iff \\oint \\mathbf{F}\\cdot d\\mathbf{r} = 0 \\iff \\mathbf{F} = \\nabla u',
        note: '保守场 = 梯度场 = 无旋场（在单连通域内三者等价）。势函数 u 满足 ∂u/∂x=P 等。',
        detail: '四个等价条件（在单连通域内）：①rot F = 0（无旋）；②沿任意闭曲线积分为 0；③曲线积分与路径无关；④存在势函数 u 使得 F = ∇u（即 P=∂u/∂x, Q=∂u/∂y, R=∂u/∂z）。求势函数的方法：偏积分法（u=∫Pdx+φ(y,z)，再对 y 求导确定 φ_y 等）或线积分法（选从原点出发的折线积分）。验证保守场的最简单方法：计算旋度是否为零。',
        level: 'important',
      },
      {
        name: '三大定理统一：格林/斯托克斯/高斯',
        latex: '\\begin{aligned} &\\text{Green（平面）：} \\oint_L \\!=\\! \\iint_D \\left(\\frac{\\partial Q}{\\partial x}-\\frac{\\partial P}{\\partial y}\\right) \\\\ &\\text{Stokes（空间）：} \\oint_L \\!=\\! \\iint_\\Sigma (\\operatorname{rot}\\mathbf{F})\\cdot d\\mathbf{S} \\\\ &\\text{Gauss（空间）：} \\oiint_\\Sigma \\!=\\! \\iiint_\\Omega \\operatorname{div}\\mathbf{F}\\,dV \\end{aligned}',
        note: 'Green: 线积分↔面积分；Stokes: 线积分↔曲面积分（旋度通量）；Gauss: 曲面积分↔体积分（散度体积分）。',
        detail: '这三大定理是微积分中最重要的统一性结果，它们将边界上的积分与内部区域上的积分联系起来：①格林公式（2D）：封闭曲线积分 = 内部区域二重积分（被积式 = ∂Q/∂x-∂P/∂y = 旋度的 z 分量）；②斯托克斯公式（3D）：空间封闭曲线积分 = 张在该曲线上曲面的面积分（被积式 = rot F·n）；③高斯公式（3D）：封闭曲面积分 = 内部区域三重积分（被积式 = div F）。统一定理：∫_{∂Ω} ω = ∫_Ω dω（广义斯托克斯）。',
        level: 'advanced',
      },
      {
        name: '方向导数与梯度',
        latex: '\\frac{\\partial f}{\\partial \\mathbf{l}} = \\nabla f \\cdot \\mathbf{l}_0 = f_x\\cos\\alpha + f_y\\cos\\beta + f_z\\cos\\gamma',
        note: '方向导数的最大值 = |∇f|（梯度的模），方向 = 梯度方向。梯度方向是函数增长最快的方向。',
        detail: '方向导数 ∂f/∂l 衡量函数在指定方向 l 上的变化率。计算公式 = ∇f·l₀（梯度与单位方向向量的点积）。重要结论：①方向导数的最大值 = |∇f|（沿梯度方向）；②最小值 = -|∇f|（沿负梯度方向）；③等值面法线方向 = 梯度方向；④等高线上方向导数为 0（沿等值线的切线方向）。几何意义：梯度向量垂直于等值面，指向 f 增长最快的方向。',
        level: 'important',
      },
    ],
  },

  // ===== 线性代数 =====
  'linalg-det': {
    id: 'linalg-det',
    title: '行列式',
    subject: '线性代数',
    formulas: [
      {
        name: '2 阶与 3 阶行列式',
        latex: '\\begin{aligned} &\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix} = ad - bc \\\\ &\\begin{vmatrix} a_1 & a_2 & a_3 \\\\ b_1 & b_2 & b_3 \\\\ c_1 & c_2 & c_3 \\end{vmatrix} = a_1b_2c_3 + a_2b_3c_1 + a_3b_1c_2 - a_3b_2c_1 - a_2b_1c_3 - a_1b_3c_2 \\end{aligned}',
        note: '二阶：主对角线减副对角线。三阶：对角线法则（共6项，3正3负）。',
        detail: '二阶行列式 = ad-bc，几何意义：以 (a,b) 和 (c,d) 为边的平行四边形面积。三阶对角线法则：主对角线方向（↘）3 条各 3 个元素乘积为正，副对角线方向（↙）3 条为负。注意：对角线法则仅适用于 3 阶！4 阶及以上必须用展开或化三角法。考试中 2/3 阶行列式要能快速心算。',
      },
      {
        name: '行列式核心性质',
        latex: '\\begin{aligned} &\\text{① 转置不变：} |A^T| = |A| \\ &\\text{② 交换两行（列）变号} \\ &\\text{③ 某行乘 } k \\text{，行列式乘 } k \\ &\\text{④ 某行加到另一行，值不变} \\ &\\text{⑤ } |AB| = |A|\\cdot|B| \\end{aligned}',
        note: '性质④是行列式计算的核心工具，目标化为上三角行列式。',
        detail: '这五条性质是行列式计算的全部工具。核心思路——用性质④（倍加变换）把行列式化为上三角形式，则行列式 = 主对角线元素之积。注意：①倍加变换不改值；②交换两行要变号（别漏了）；③某行提取公因子，k 提到行列式外面；④两行成比例 → 行列式为 0；⑤|kA| = k^n|A|（不是 k|A|！n 是阶数）。',
      },
      {
        name: '行列式按行（列）展开',
        latex: '|A| = \\sum_{j=1}^{n} a_{ij} A_{ij},\\quad A_{ij} = (-1)^{i+j} M_{ij}',
        note: '代数余子式的符号(−1)^{i+j} 容易错！"正负相间棋盘格"。',
        detail: '代数余子式 A_ij = (-1)^{i+j} × 去掉第 i 行第 j 列后的子式。符号规律：左上角为正，相邻格交替正负（像国际象棋棋盘）。计算技巧：选 0 最多的行或列展开，减少计算量。应用：伴随矩阵 A* = [A_ji]（注意下标是转置的——第 i 行第 j 列是 A_ji 不是 A_ij！），A^{-1} = A*/|A|。',
      },
      {
        name: '范德蒙行列式',
        latex: '\\begin{vmatrix} 1 & 1 & \\cdots & 1 \\\\ x_1 & x_2 & \\cdots & x_n \\\\ \\vdots & \\vdots & \\ddots & \\vdots \\\\ x_1^{n-1} & x_2^{n-1} & \\cdots & x_n^{n-1} \\end{vmatrix} = \\prod_{1 \\leq i < j \\leq n} (x_j - x_i)',
        note: '结果 = 所有可能的 (x_j − x_i) 乘积。识别出范德蒙结构是解题关键。',
        detail: '范德蒙行列式的特征：第 1 行全 1，第 2 行是各变量的 1 次方，第 3 行是 2 次方…依此类推。结果 = ∏(x_j - x_i)（所有 j>i 的差乘积）。重要推论：范德蒙行列式 ≠ 0 ⟺ 所有 x_i 互不相等。考试经常隐藏范德蒙结构——通过列提取公因子或行变换将给定行列式转化为范德蒙形式，然后套公式。',
      },
      {
        name: '克拉默法则',
        latex: 'Ax = b,\\ |A| \\neq 0 \\ \\Rightarrow \\ x_i = \\frac{|A_i|}{|A|},\\quad A_i \\text{ 为将 } A \\text{ 第 } i \\text{ 列替换为 } b \\text{ 所得}',
        note: '用行列式解 n 元线性方程组。只适用于方阵且 |A|≠0。对 n≥4 计算量远超消元法。',
        detail: '克拉默法则给出方程组解的显式行列式公式。步骤：①计算系数行列式 |A|；②对每个未知数 x_i，将 A 第 i 列替换为常数列 b 得 A_i，计算 |A_i|；③x_i = |A_i|/|A|。局限性：需计算 n+1 个 n 阶行列式，n≥4 时计算量巨大，主要用于理论推导而非实际计算。理论价值：①给出齐次方程组 Ax=0 有非零解的充要条件 |A|=0；②证明解对系数的连续依赖性。常考：用克拉默法则解含参数的小型方程组（n=2,3），或证明解的存在唯一性。',
      },
    ],
  },

  'linalg-matrix': {
    id: 'linalg-matrix',
    title: '矩阵',
    subject: '线性代数',
    formulas: [
      {
        name: '矩阵乘法与转置',
        latex: '(AB)_{ij} = \\sum_{k=1}^{n} a_{ik}b_{kj},\\quad (AB)^T = B^T A^T',
        note: 'AB 可乘 ⇔ A 的列数 = B 的行数。乘法不满足交换律！',
        detail: '矩阵乘法核心规则：①A(m×n) × B(n×p) = C(m×p)，C_ij = A 第 i 行 · B 第 j 列（对应元素相乘再求和）；②一般不交换：AB ≠ BA（甚至可能 BA 根本不可乘）；③转置反转顺序：(AB)^T = B^T A^T（不是 A^T B^T！）；④(AB)^{-1} = B^{-1}A^{-1}。秩的关系：rank(AB) ≤ min(rank(A), rank(B))。',
      },
      {
        name: '逆矩阵（2阶公式 + 伴随矩阵法）',
        latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}^{-1} = \\frac{1}{ad-bc} \\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix},\\quad A^{-1} = \\frac{A^*}{|A|}',
        note: '可逆 ⇔ |A|≠0。伴随矩阵 A* 的每个元素是代数余子式（注意转置位置）。',
        detail: '二阶逆矩阵口诀："主对调，副变号，除以行列式"。即 a↔d 互换，b 和 c 取反，然后每个元素除以 ad-bc。一般方法 A^{-1} = A*/|A|：伴随矩阵 A* 的元素 (i,j) = A_ji（是 j 行 i 列的代数余子式，注意下标交换！）。判定可逆的等价条件：|A|≠0 ⇔ A 满秩 ⇔ 行/列向量线性无关 ⇔ 齐次方程组仅有零解。',
      },
      {
        name: '矩阵的秩 — 初等变换求法',
        latex: 'A \\xrightarrow{\\text{初等行变换}} \\text{行阶梯形},\\quad \\text{rank}(A) = \\text{非零行行数}',
        note: '行变换不改变秩。满秩 ⇔ 可逆 ⇔ |A|≠0。秩=行秩=列秩。',
        detail: '初等行变换不改变矩阵的秩（列变换也不改）。化为行阶梯形后，非零行数 = 秩。需要同时用到行、列变换？只做行变换就够了。秩的重要不等式：①0≤rank(A)≤min(m,n)；②rank(A+B)≤rank(A)+rank(B)；③rank(AB)≤min(rank(A),rank(B))；④秩−零化度定理：rank(A)+dim(Nul(A))=n。满秩时所有等价条件同时成立。',
      },
      {
        name: '矩阵方程求解',
        latex: '\\begin{aligned} AX = B &\\Rightarrow X = A^{-1}B \\\\ XA = B &\\Rightarrow X = BA^{-1} \\\\ AXB = C &\\Rightarrow X = A^{-1}CB^{-1} \\end{aligned}',
        note: '前提 A、B 均可逆。注意乘的方向！AX=B 左乘 A⁻¹，XA=B 右乘 A⁻¹。',
        detail: '最容易出错的就是乘的方向！①AX=B：A 在 X 左边 → 两边同时左乘 A^{-1} → X = A^{-1}B；②XA=B：A 在 X 右边 → 两边同时右乘 A^{-1} → X = BA^{-1}。考试中如果 A 不可逆，不能用此法，需用初等变换法（对增广矩阵做行变换）。AXB=C 的情况：先左乘 A^{-1}，再右乘 B^{-1}，注意中间 C 的位置不变。',
      },
    ],
  },

  'linalg-vector': {
    id: 'linalg-vector',
    title: '向量与方程组',
    subject: '线性代数',
    formulas: [
      {
        name: '线性相关与线性无关',
        latex: 'c_1\\alpha_1 + \\cdots + c_m\\alpha_m = 0 \\begin{cases} \\text{只有零解} & \\Rightarrow \\text{线性无关} \\\\ \\text{有非零解} & \\Rightarrow \\text{线性相关} \\end{cases}',
        note: 'n 个 n 维向量 → 行列式 ≠0 则无关。向量个数 > 维数 → 必然相关。',
        detail: '几何理解：线性相关 = 至少一个向量可由其余向量线性表示（有"多余"向量）；线性无关 = 每个向量都不可替代。判定方法：①把向量作行/列排成矩阵，求秩 = 向量个数则无关；②n 个 n 维向量 → 行列式 ≠ 0 则无关；③向量个数 > 维数 → 必然相关（这是快速判断的神器！）。含零向量的向量组必然线性相关。',
      },
      {
        name: '齐次方程组 Ax = 0 的解结构',
        latex: '\\text{解空间维数} = n - \\text{rank}(A),\\quad \\text{通解} = c_1\\xi_1 + \\cdots + c_{n-r}\\xi_{n-r}',
        note: '基础解系含 n−r 个线性无关的解向量。每个自由变量取 1（其余取0）得一个基。',
        detail: '解空间（零空间）的维数 = n - r，其中 n 是未知数个数，r = rank(A)。求基础解系步骤：①行变换化 A 为行最简形；②确定自由变量（非主元列对应的变量）；③逐个令一个自由变量 = 1、其余自由变量 = 0，回代求出主变量，得到基础解向量。齐次方程组必有零解，有非零解 ⟺ |A|=0 ⟺ rank(A) < n。',
      },
      {
        name: '非齐次方程组 Ax = b 的解结构',
        latex: 'Ax = b \\text{ 有解} \\iff \\text{rank}(A) = \\text{rank}(A,b),\\quad \\text{通解} = \\eta^* + c_1\\xi_1 + \\cdots',
        note: '通解 = 一个特解 + 导出组（Ax=0）的通解。秩相等才有解！',
        detail: '解的存在性判定（充要条件）：系数矩阵的秩 = 增广矩阵的秩。当有解时：①r=n → 唯一解；②r<n → 无穷多解（含 n-r 个自由参数）。通解结构 = 特解 η* + 齐次通解 c₁ξ₁+...。求特解的技巧：令所有自由变量 = 0，回代求主变量。注意：非齐次方程组的解不构成线性空间（不含零向量），但两个特解之差是齐次解。',
      },
      {
        name: '向量空间基与维数',
        latex: '\\dim V = \\text{基中向量个数},\\quad \\dim(V_1+V_2) = \\dim V_1 + \\dim V_2 - \\dim(V_1 \\cap V_2)',
        note: '类似容斥原理。最大无关组即为基，秩即维数。',
        detail: '基 = 能张成整个空间的最小向量组 = 最大线性无关组。维数 = 基所含向量个数 = 向量组的秩。维数公式 dim(V₁+V₂) = dim V₁ + dim V₂ - dim(V₁∩V₂) 与集合的容斥原理形式一致。求基的方法：把向量组排成矩阵，行变换后非零行对应的原向量构成一组基。常见问题：验证一组向量是否构成基 → 判断是否线性无关且个数 = 维数。',
      },
    ],
  },

  'linalg-eigen': {
    id: 'linalg-eigen',
    title: '特征值与对角化',
    subject: '线性代数',
    formulas: [
      {
        name: '特征值与特征方程',
        latex: 'A\\mathbf{x} = \\lambda \\mathbf{x},\\ \\mathbf{x} \\neq 0 \\iff |A - \\lambda I| = 0',
        note: '先解特征方程得 λ，再解 (A−λI)x=0 得特征向量。λ 是特征值 ⇔ |A−λI|=0。',
        detail: '特征值 λ 是使得 (A-λI)x=0 有非零解的数，即满足特征方程 |A-λI|=0 的根。步骤：①写出特征多项式 f(λ)=|A-λI|（是 λ 的 n 次多项式）；②求根得特征值 λ_i；③对每个 λ_i，解齐次方程组 (A-λ_i I)x=0，所有非零解即为对应的特征向量。注意：特征向量不能为零向量，但 λ 可以为零。',
      },
      {
        name: '特征值与迹、行列式的关系',
        latex: '\\sum \\lambda_i = \\mathrm{tr}(A) = \\sum a_{ii},\\quad \\prod \\lambda_i = |A|',
        note: '所有特征值之和=迹，之积=行列式。常用于验证计算结果。',
        detail: '这是两个超实用的验证公式：①Σλ_i = tr(A) = 主对角线元素之和；②Πλ_i = |A| = 行列式。算出特征值后，用这两条快速验证计算是否正确。重要推论：|A|=0 ⟺ 至少一个特征值为 0 ⟺ A 不可逆；所有特征值 ≠ 0 ⟺ A 可逆。A 的逆矩阵的特征值是 1/λ_i，A^k 的特征值是 λ_i^k。',
      },
      {
        name: '相似对角化条件',
        latex: 'A \\sim \\Lambda = \\text{diag}(\\lambda_1,\\dots,\\lambda_n) \\iff A \\text{ 有 } n \\text{ 个线性无关的特征向量}',
        note: '不同特征值对应的特征向量自动线性无关。重根需要检查几何重数 = 代数重数。',
        detail: '对角化的充要条件：A 有 n 个线性无关的特征向量，即可逆矩阵 P 的列就是这 n 个特征向量。对角矩阵 Λ 的对角线是对应的特征值。关键判定：①若所有特征值互不相同 → 必定可对角化（充分条件）；②若有重根 λ_k（代数重数 m_k），需检查该特征值的几何重数（解空间的维数）n-rank(A-λ_k I) 是否也等于 m_k — 相等则可对角化，否则不可。',
      },
      {
        name: '实对称矩阵正交对角化',
        latex: 'A = A^T \\Rightarrow A = Q\\Lambda Q^T,\\ Q^{-1}=Q^T',
        note: '实对称矩阵的特征值全为实数，不同特征值的特征向量正交，必可对角化。',
        detail: '实对称矩阵三大优良性质：①特征值全为实数；②不同特征值对应的特征向量自动正交；③必定可对角化（即使有重根）。正交对角化步骤：①求特征值；②对每个特征值求特征向量；③不同 λ 的特征向量自动正交，同一 λ 内的特征向量用施密特正交化；④所有特征向量单位化后作为 Q 的列。Q^T A Q = Λ，Λ 对角线为特征值。',
      },
      {
        name: '施密特正交化',
        latex: '\\begin{aligned} \\beta_1 &= \\alpha_1 \\\\ \\beta_k &= \\alpha_k - \\sum_{i=1}^{k-1}\\frac{\\langle\\alpha_k,\\beta_i\\rangle}{\\langle\\beta_i,\\beta_i\\rangle}\\beta_i \\quad (k=2,3,\\dots) \\end{aligned}',
        note: '将线性无关向量组化为正交向量组。每步减去在前 k-1 个正交基上的投影分量。',
        detail: '施密特正交化的本质：从第 k 个原向量中减去它在前面 k-1 个已正交化向量上的投影，得到与它们正交的新向量。步骤：①β₁=α₁（第一个不变）；②β₂=α₂-(⟨α₂,β₁⟩/⟨β₁,β₁⟩)β₁；③以此类推。投影系数 c = ⟨α_k,β_i⟩/⟨β_i,β_i⟩ 是 α_k 在 β_i 方向的分量占比。正交化后再单位化：e_i = β_i/|β_i|，得标准正交基。关键性质：施密特正交化保持向量组的张成空间不变，即 span{α₁,...,α_k} = span{β₁,...,β_k}。常应用于：二次型标准化、QR 分解、最小二乘问题。',
      },
    ],
  },

  'linalg-quadratic': {
    id: 'linalg-quadratic',
    title: '二次型',
    subject: '线性代数',
    formulas: [
      {
        name: '二次型及其矩阵表示',
        latex: 'f(x_1,x_2,x_3) = \\mathbf{x}^T A \\mathbf{x},\\quad A^T = A',
        note: '二次型对应唯一对称矩阵 A：平方项系数在对角线，交叉项系数平分到两侧。',
        detail: '将二次型写成 x^T A x 时，A 必须是实对称矩阵（A^T=A）。规则：①平方项 x_i² 的系数直接放对角线 a_ii；②交叉项 x_i x_j（i≠j）的系数平分——一半给 a_ij，一半给 a_ji。例如 3x₁x₂ → a₁₂=a₂₁=1.5。注意：二次型的矩阵表示是唯一的（要求对称），但反过来一个对称矩阵对应的二次型也是唯一的。',
      },
      {
        name: '二次型标准化',
        latex: '\\mathbf{x}^T A \\mathbf{x} \\xrightarrow{\\mathbf{x}=Py} \\lambda_1 y_1^2 + \\cdots + \\lambda_n y_n^2',
        note: '正交变换法用特征向量作 P；配方法逐项消元。标准型不唯一但正负惯性指数唯一。',
        detail: '两种主要方法：①正交变换法——求 A 的特征值 λ_i，标准型 = λ₁y₁²+...+λ_ny_n²。正交变换保持几何形状（合同变换中唯一保持距离的）；②配方法——逐项配方消交叉项，每次配一个变量的完全平方。注意标准型并不唯一（配方顺序不同结果不同），但正项个数 p 和负项个数 q 是唯一确定的（惯性定理）。',
      },
      {
        name: '正定性判定（三个充要条件）',
        latex: 'A \\text{ 正定} \\iff \\forall \\mathbf{x} \\neq 0,\\ \\mathbf{x}^T A \\mathbf{x} > 0 \\iff \\text{特征值全} > 0 \\iff \\text{顺序主子式全} > 0',
        note: '判定正定的三种等价方法。半正定：≥0；负定：<0；不定：有正有负。',
        detail: '三选一，哪种方便用哪种：①定义法——对任意非零 x 验证 x^T A x > 0（大题证明用）；②特征值法——所有特征值 > 0（计算题常用）；③顺序主子式法——所有顺序主子式 > 0（适合中小矩阵快速判断）。负定的等价条件：所有特征值 < 0，或奇数阶主子式 < 0 且偶数阶 > 0。注意：正定 ⟹ |A|>0，但 |A|>0 不能推出正定！',
      },
      {
        name: '惯性定理',
        latex: '\\text{任何实二次型经可逆线性替换后，正项个数 } p \\text{ 和负项个数 } q \\text{ 不变}',
        note: '正负惯性指数是二次型在合同变换下的不变量。p+q = rank(A)。',
        detail: '惯性定理说明：虽然二次型的标准型不唯一（取决于所用变换），但其中正平方项的个数 p（正惯性指数）和负平方项的个数 q（负惯性指数）是固定不变的。换言之，(p, q) 是二次型在合同关系下的完全不变量。推论：两个同阶实对称矩阵合同 ⟺ 它们有相同的正负惯性指数。p+q = rank(A)，p-q = 符号差。',
      },
    ],
  },

  'linalg-space': {
    id: 'linalg-space',
    title: '线性空间与线性变换',
    subject: '线性代数',
    formulas: [
      {
        name: '线性空间的八条公理',
        latex: '\\begin{aligned} &\\text{加法：封闭、交换、结合、零元、负元} \\\\ &\\text{数乘：封闭、分配律 }(k+l)\\alpha=k\\alpha+l\\alpha,\\ k(\\alpha+\\beta)=k\\alpha+k\\beta \\\\ &\\text{数乘结合：}k(l\\alpha)=(kl)\\alpha,\\ 1\\cdot\\alpha=\\alpha \\end{aligned}',
        note: '满足八条公理的集合即为线性空间（向量空间）。验证子空间只需证非空 + 对加法和数乘封闭。',
        detail: '线性空间是现代线性代数的公理化基础。八条公理分为：加法四条（封闭、交换律、结合律、零元存在、负元存在），数乘四条（封闭、分配律×2、结合律、单位元）。验证子空间的三步法：①非空（通常取零向量）；②对加法封闭（α,β∈W⇒α+β∈W）；③对数乘封闭（α∈W,k∈R⇒kα∈W）。常见线性空间：R^n（n 维实向量）、P_n[x]（次数≤n 的多项式）、C[a,b]（连续函数）。',
        level: 'important',
      },
      {
        name: '基变换与坐标变换',
        latex: '\\begin{aligned} &(\\beta_1,\\dots,\\beta_n) = (\\alpha_1,\\dots,\\alpha_n)P \\\\ &\\text{坐标变换：} x = P\\,y \\quad\\text{（其中 } P \\text{ 为过渡矩阵）} \\end{aligned}',
        note: '过渡矩阵 P 的列是 β 在旧基 α 下的坐标。P 必可逆，新旧坐标关系 x=Py。',
        detail: '基变换是理解线性变换矩阵表示的关键。若旧基 α₁,...,α_n 到新基 β₁,...,β_n 的过渡矩阵为 P（即每个 βⱼ 用 α 的线性组合写出作为 P 的第 j 列），则同一向量在新旧基下的坐标满足 x_旧 = P·y_新。反之 y = P⁻¹x。过渡矩阵 P 必可逆（基的等价性）。应用：若线性变换在旧基下矩阵为 A，在新基下为 B，则 B = P⁻¹AP（相似关系）。记忆口诀："旧坐标 = 过渡矩阵 × 新坐标"。',
        level: 'important',
      },
      {
        name: '线性变换的矩阵表示',
        latex: '\\mathcal{A}(\\alpha_1,\\dots,\\alpha_n) = (\\alpha_1,\\dots,\\alpha_n)A \\quad\\Rightarrow\\quad \\mathcal{A}(\\xi) \\text{ 的坐标 } = A\\,x',
        note: 'A 的第 j 列 = 第 j 个基向量经变换后的坐标。同一变换在不同基下的矩阵相似：B=P⁻¹AP。',
        detail: '线性变换与矩阵的一一对应建立在选定基的基础上。若基为 α₁,...,α_n，变换 A 将每个基向量映射为它们的线性组合：A(αⱼ)=a_{1j}α₁+...+a_{nj}α_n，则 A 的矩阵 A=(a_{ij})。重要关系：若向量 ξ 的坐标为 x，则 A(ξ) 的坐标为 A·x。同一个线性变换在不同基下的矩阵相似：B=P⁻¹AP。换言之，"变换找相似，矩阵找合同"（二次型用合同，线性变换用相似）。',
        level: 'important',
      },
      {
        name: '核与值域（维数公式）',
        latex: '\\dim \\ker \\mathcal{A} + \\dim \\operatorname{Im} \\mathcal{A} = \\dim V = n',
        note: '核（零空间）的维数 + 值域（列空间）的维数 = 定义域维数。dim Ker = n - rank(A)。',
        detail: '维数公式是线性变换最重要的结论之一。核 Ker A = {x | Ax=0}（齐次方程解空间），值域 Im A = {Ax | x∈V} = 列空间 = 列向量的所有线性组合。dim Ker = n - rank(A)（齐次方程的自由变量个数），dim Im = rank(A)。推论：①A 是单射 ⟺ Ker A = {0} ⟺ rank(A)=n；②A 是满射 ⟺ Im A = 全空间 ⟺ rank(A)=dim(目标空间)；③方阵满秩 ⟺ 既是单射又是满射。',
        level: 'important',
      },
      {
        name: '线性变换的特征值与特征向量',
        latex: '\\mathcal{A}(\\xi) = \\lambda \\xi \\quad\\Rightarrow\\quad |A - \\lambda I| = 0 \\ \\text{（特征方程）}',
        note: '线性变换的特征值/向量与矩阵的特征值/向量一一对应，不依赖基的选取（相似不变量）。',
        detail: '线性变换的特征值与特征向量定义：存在非零向量 ξ 使得 A(ξ)=λξ。在基下转化为矩阵特征方程 |A-λI|=0。关键性质：①特征值是相似不变量（不同基下矩阵的特征值相同）；②属于不同特征值的特征向量线性无关；③特征子空间 V_λ = {ξ | A(ξ)=λξ} = Ker(A-λI)；④几何重数（dim V_λ）≤ 代数重数（特征根的重数）。线性变换可对角化 ⟺ 有 n 个线性无关的特征向量 ⟺ 每个特征值的几何重数=代数重数。',
        level: 'advanced',
      },
    ],
  },

  // ===== 离散数学 =====
  'disc-logic': {
    id: 'disc-logic',
    title: '命题逻辑与谓词逻辑',
    subject: '离散数学',
    formulas: [
      {
        name: '五大逻辑联结词真值表',
        latex: '\\begin{aligned} &\\lnot p: p \\text{ 真则假} \\\\[4pt] &p \\land q: \\text{两者皆真才真} \\\\[4pt] &p \\lor q: \\text{至少一真即真} \\\\[4pt] &p \\to q: \\text{只有 } p \\text{ 真 } q \\text{ 假才为假} \\\\[4pt] &p \\leftrightarrow q: \\text{同真同假才为真} \\end{aligned}',
        note: 'p→q 仅在 T→F 时为假，其他情况（F→任意）均为真！容易错。',
        detail: '最重要的坑：蕴含 p→q 在 p 为假时自动为真（虚真）。这不符合日常直觉但符合数学逻辑。例如"如果 1+1=3，那么地球是方的"在逻辑上为真命题。合取 ∧ 的真值表类似乘法（全 1 才 1），析取 ∨ 类似加法（有 1 即 1）。等价 ↔ 在两者同真假时为真，即 (p→q)∧(q→p)。',
      },
      {
        name: '重要逻辑等价式',
        latex: '\\begin{aligned} p \\to q &\\equiv \\lnot p \\lor q \\\\ \\lnot(p \\to q) &\\equiv p \\land \\lnot q \\\\ p \\leftrightarrow q &\\equiv (p \\to q) \\land (q \\to p) \\end{aligned}',
        note: '蕴含等价式最常用，将→转换为¬和∨便于化简。',
        detail: 'p→q ≡ ¬p∨q 是最核心的等价式——把不直观的蕴含化为直观的析取。由此可得 ¬(p→q) ≡ p∧¬q（否定蕴含 = 前件真且后件假），这是最重要的否定公式。等价 ↔ 可用两个蕴含的合取表示。这些等价式在证明逻辑恒等式时经常用：先把所有 → 和 ↔ 化为 ¬, ∧, ∨，然后用德摩根律和分配律化简。',
      },
      {
        name: '德摩根律（命题 & 谓词）',
        latex: '\\begin{aligned} \\lnot(p \\land q) &\\equiv \\lnot p \\lor \\lnot q \\\\ \\lnot(p \\lor q) &\\equiv \\lnot p \\land \\lnot q \\\\ \\lnot\\forall x P(x) &\\equiv \\exists x \\lnot P(x) \\\\ \\lnot\\exists x P(x) &\\equiv \\forall x \\lnot P(x) \\end{aligned}',
        note: '否定号穿过量词时，∀↔∃ 互换！考试必有一道证明或化简。',
        detail: '德摩根律的推广：否定号往里走时 ∧↔∨ 互换、∀↔∃ 互换。例如 ¬∀x∃y P(x,y) ≡ ∃x∀y ¬P(x,y)——否定号每穿过一个量词就翻转一次量词类型。命题逻辑的德摩根律用真值表可轻松验证。实际应用中，论证"并非所有人都及格"等价于"存在一个人不及格"就是 ∀→∃ 的转换。',
      },
      {
        name: '主析取范式与主合取范式',
        latex: '\\begin{aligned} &\\text{主析取范式：极小项（合取）的析取，对应真值表中所有 T 行} \\\\ &\\text{主合取范式：极大项（析取）的合取，对应真值表中所有 F 行} \\end{aligned}',
        note: '先列真值表！每个 T 行写极小项（变元真=本身，假=否定）再析取。',
        detail: '步骤：①列出所有命题变元，构造真值表（n 个变元有 2^n 行）；②主析取范式：找出所有函数值为 T 的行，每行写一个极小项（变元为 T 取本身，F 取否定），所有极小项用 ∨ 连接；③主合取范式类似但针对 F 行，极大项中变元为 F 取本身、T 取否定，用 ∧ 连接。主范式是唯一的——同一真值表只有一种主析取/主合取范式。',
      },
      {
        name: '推理规则（常用蕴涵式）',
        latex: '\\begin{aligned} &\\text{假言推理：} p,\\ p \\to q \\Rightarrow q \\ &\\text{拒取式：} \\lnot q,\\ p \\to q \\Rightarrow \\lnot p \\ &\\text{假言三段论：} p \\to q,\\ q \\to r \\Rightarrow p \\to r \\end{aligned}',
        note: '证明题中逐步推理的规则，类似"已知→结论"的链条。',
        detail: '假言推理（Modus Ponens）是最基本推理：知道 p 成立，又知道 p→q，则推出 q。拒取式（Modus Tollens）：知道 q 不成立，又知道 p→q，则推出 p 也不成立。假言三段论：蕴含关系的传递性。此外还有：附加律 p⇒p∨q、化简律 p∧q⇒p、构造性二难 (p→q)∧(r→s)∧(p∨r) ⇒ q∨s。证明题就是这些基本规则的组合运用。',
      },
    ],
  },

  'disc-set-relation': {
    id: 'disc-set-relation',
    title: '集合与关系',
    subject: '离散数学',
    formulas: [
      {
        name: '集合运算恒等式',
        latex: '\\begin{aligned} A \\cup (B \\cap C) &= (A \\cup B) \\cap (A \\cup C) \\ A \\cap (B \\cup C) &= (A \\cap B) \\cup (A \\cap C) \\ \\overline{A \\cup B} &= \\overline{A} \\cap \\overline{B} \\end{aligned}',
        note: '分配律和德摩根律在集合中的形式。用文氏图直观验证。',
        detail: '集合恒等式与命题逻辑恒等式一一对应：∪↔∨, ∩↔∧, 补集↔¬。因此集合的德摩根律：A∪B 的补 = A补 ∩ B补。集合分配律注意：①∪ 对 ∩ 分配；②∩ 对 ∪ 分配（命题逻辑中 ∧ 也对 ∨ 分配，这是集合恒等式比算术恒等式好的地方）。证明集合恒等式的标准方法：取任意元素 x，从左右两边互相推导。',
      },
      {
        name: '容斥原理',
        latex: '\\begin{aligned} |A \\cup B| &= |A|+|B|-|A \\cap B| \\\\ |A \\cup B \\cup C| &= |A|+|B|+|C| - |A \\cap B| - |A \\cap C| - |B \\cap C| + |A \\cap B \\cap C| \\end{aligned}',
        note: 'n 个集合：加单数、减两两交、加三三交…符号交替。计数题必考。',
        detail: '公式规律：①加所有单个集合的大小；②减所有两两交的大小；③加所有三三交的大小；④减所有四四交的大小…符号交替。直观理解：单数时校正了漏算的，减两两交时校正了重复计算的，但三三交又被多减了所以加回来。典型应用：求 1~100 中能被 2 或 3 或 5 整除的数的个数。',
        level: 'important',
      },
      {
        name: '关系的五种性质',
        latex: '\\begin{aligned} &\\text{自反：} \\forall x,\\ (x,x) \\in R \\\\[4pt] &\\text{反自反：} \\forall x,\\ (x,x) \\notin R \\\\[4pt] &\\text{对称：} (x,y) \\in R \\Rightarrow (y,x) \\in R \\\\[4pt] &\\text{反对称：} (x,y)\\in R \\land (y,x)\\in R \\Rightarrow x=y \\\\[4pt] &\\text{传递：} (x,y)\\in R \\land (y,z)\\in R \\Rightarrow (x,z) \\in R \\end{aligned}',
        note: '关系矩阵判定：自反=对角线全1；对称=矩阵对称；传递需验证。',
        detail: '用关系矩阵快速判定：①自反→主对角线全 1；②反自反→主对角线全 0；③对称→矩阵对称（M = M^T）；④反对称→矩阵中对称位置不能同时为 1（即 M_ij=1 则 M_ji=0，除非 i=j）；⑤传递→若 M_ij=1 且 M_jk=1 则必须 M_ik=1（需逐对验证，没有简单的矩阵性质）。注意一个关系可以既不是自反也不是反自反（有些对角元 1 有些 0）。',
      },
      {
        name: '等价关系与划分',
        latex: 'R \\text{ 是等价关系} \\iff R \\text{ 自反、对称、传递}',
        note: '等价关系 ↔ 集合的一个划分（商集）。等价类 = 与某元素等价的所有元素集合。',
        detail: '等价关系 = 集合上的"分类规则"。核心结论：集合 A 上的每个等价关系对应 A 的唯一划分（商集 = 所有等价类的集合），反之每个划分对应唯一的等价关系。等价类的性质：①每个元素恰好属于一个等价类；②同一等价类中的元素两两等价；③不同等价类不相交。常见例子：同余关系 mod n、矩阵的相似关系（在方阵集合上）。',
      },
      {
        name: '偏序关系与哈斯图',
        latex: 'R \\text{ 是偏序关系} \\iff R \\text{ 自反、反对称、传递}',
        note: '偏序集 (A,≤) 用哈斯图表示。极大元/极小元 vs 最大元/最小元，概念区分！',
        detail: '哈斯图画法：①去掉所有自环（自反隐含）；②箭头方向统一向上（省略箭头）；③若 a→b 且 b→c，省略 a→c 的直接连线（传递隐含）。关键概念辨析：①极大元 = 没有比它更大的元素（可以有多个）；②最大元 = 比所有元素都大（至多一个）；③上界 = 比子集中所有元素都大的元素；④上确界 = 最小的上界。这些概念在格与布尔代数中至关重要。',
      },
    ],
  },

  'disc-graph': {
    id: 'disc-graph',
    title: '图论',
    subject: '离散数学',
    formulas: [
      {
        name: '握手定理',
        latex: '\\sum_{v \\in V} \\deg(v) = 2|E|',
        note: '度数之和 = 边数×2。推论：奇度顶点个数必为偶数。基础但必考。',
        detail: '每条边连接两个顶点，贡献 2 个度数，所以度数和 = 2×边数。重要推论：图中奇度顶点的个数必为偶数（因为度数和为偶数，奇度顶点必须成对出现）。典型应用：已知各顶点度数求边数，或判断一个度数序列是否能构成图。竞赛/考试中常结合握手定理和树的性质（|E|=|V|-1）综合出题。',
        level: 'important',
      },
      {
        name: '完全图与二分图边数',
        latex: '|E(K_n)| = \\frac{n(n-1)}{2},\\quad |E(K_{m,n})| = mn',
        note: '完全图 K_n：每对顶点间都有边。完全二分图 K_{m,n} 边数=m×n。',
        detail: 'K_n 边数 = C(n,2) = n(n-1)/2（n 个顶点中任选 2 个连边）。K_n 每个顶点度数为 n-1。K_{m,n} 是完全二分图——左侧 m 个顶点、右侧 n 个顶点，左右之间所有边都存在（m×n 条），同侧内部无边。K_{3,3} 是著名的非平面图（与 K_5 并列，是库拉托夫斯基定理中的两个禁止子图）。',
      },
      {
        name: '欧拉图判定',
        latex: '\\begin{aligned} &\\text{欧拉回路（闭迹）：所有顶点度数为偶数} \\\\ &\\text{欧拉路径（开迹）：恰有 2 个奇度顶点} \\end{aligned}',
        note: '连通且满足度数条件。七桥问题→欧拉图→一笔画的数学本质。',
        detail: '前提：图必须连通。有欧拉回路（从某点出发不重复走完所有边回到起点）⟺ 所有顶点度数均为偶数。有欧拉路径（不重复走完所有边但不回到起点）⟺ 恰有 2 个奇度顶点（起点和终点）。求解欧拉回路可用 Fleury 算法或 Hierholzer 算法。典型题：判断一个图能否一笔画成 → 数奇度顶点个数。',
      },
      {
        name: '哈密顿图（必要条件与充分条件）',
        latex: '\\begin{aligned} &\\text{必要：} \\forall S \\subset V,\\ \\omega(G-S) \\leq |S| \\\\ &\\text{充分（Dirac）：} \\forall v,\\ \\deg(v) \\geq \\frac{n}{2} \\end{aligned}',
        note: '哈密顿回路存在性无充要条件（NP难）。Dirac 和 Ore 条件只是充分条件。',
        detail: '哈密顿回路 = 经过每个顶点恰好一次的回路。判定是 NP 难的，没有简单的充要条件。必要条件：删除任意 k 个顶点后，剩余连通分量数 ≤ k（可用来否定）。Dirac 充分条件：若每个顶点度数 ≥ n/2，则必存在哈密顿回路（充分非必要）。Ore 条件：若任意一对不相邻顶点度数之和 ≥ n，则哈密顿回路存在（比 Dirac 更宽的条件）。',
      },
      {
        name: '树的等价定义',
        latex: '\\text{以下等价：连通且 |E|=|V|−1、连通无环、任意两点恰有一条路径}',
        note: 'n 个顶点的树恰有 n-1 条边。Cayley 公式：标号树个数 = n^{n-2}。',
        detail: '树是最重要的特殊图，以下每条都等价于"G 是树"：①G 连通且无回路；②G 连通且 |E|=|V|-1；③G 无回路且 |E|=|V|-1；④G 的任意两顶点间恰有一条简单路径；⑤G 无回路但加任意一条新边就产生唯一回路。生成树：连通图的极小连通子图，可通过 DFS/BFS 或破圈法求得。最小生成树用 Kruskal 或 Prim 算法。',
      },
      {
        name: '平面图欧拉公式',
        latex: 'V - E + F = 2 \\quad\\text{（连通平面图）}',
        note: '图论最著名的公式。V=顶点数，E=边数，F=面数（含外部无限面）。K₅ 和 K₃,₃ 由此可证非平面。',
        detail: '欧拉公式是平面图最基本的拓扑不变量。前提：图连通且平面嵌入。重要推论：①若 G 是简单平面图且 V≥3，则 E ≤ 3V-6（边数上界）；②K₅ 不是平面图（V=5,E=10⇒10≤9 矛盾）；③K₃,₃ 不是平面图（无三角形平面图满足 E≤2V-4，代入 V=6,E=9⇒9≤8 矛盾）——这两个是库拉托夫斯基定理的两个禁止子图。推广：k 个连通分支的平面图：V-E+F=1+k。常考题：已知顶点数和面数求边数，或利用不等式证明某图非平面。',
      },
    ],
  },

  'disc-comb': {
    id: 'disc-comb',
    title: '组合计数',
    subject: '离散数学',
    formulas: [
      {
        name: '排列与组合',
        latex: 'P(n,r) = \\frac{n!}{(n-r)!},\\quad C(n,r) = \\binom{n}{r} = \\frac{n!}{r!(n-r)!}',
        note: '排列有序，组合无序。C(n,r) = C(n, n−r) 方便计算。',
        detail: '排列 P(n,r)：从 n 个不同元素中选 r 个按顺序排列，如比赛前 3 名。组合 C(n,r)：从 n 个不同元素中选 r 个不考虑顺序，如从班级选 5 人组队。关键：看到"排列""站队""名次"→用 P；看到"选取""组合""组队"→用 C。对称性 C(n,r)=C(n,n-r)：选 r 个等价于排除 n-r 个。计算技巧：C(n,1)=n, C(n,0)=1, C(n,n)=1。',
      },
      {
        name: '二项式定理',
        latex: '(x+y)^n = \\sum_{k=0}^{n} \\binom{n}{k} x^{n-k} y^k',
        note: '系数即为杨辉三角形第 n 行。令 x=y=1 得 2^n = Σ C(n,k)。',
        detail: '展开式中 x^{n-k} y^k 的系数是 C(n,k)。重要特例：①(1+x)^n = ΣC(n,k)x^k（最常用形式）；②令 x=1 得 ΣC(n,k) = 2^n（所有组合数之和）；③令 x=-1 得 Σ(-1)^k C(n,k) = 0（奇偶交替之和为 0）。二项式系数恒等式非常多，如 C(n,0)+C(n,2)+... = C(n,1)+C(n,3)+... = 2^{n-1}。',
      },
      {
        name: '鸽巢原理（加强版）',
        latex: '\\text{将 } m \\text{ 个物体放入 } n \\text{ 个盒子：} \\exists \\text{ 某盒至少有 } \\lceil m/n \\rceil \\text{ 个}',
        note: 'm > kn → 至少一盒有 k+1 个。证明存在性问题的利器。',
        detail: '加强版鸽巢原理：平均每个盒子有 m/n 个，必然有盒子 ≥ 这个平均值（向上取整）。m > kn 时必然有盒子 ≥ k+1 个。典型应用：①13 个人中至少 2 人同月生日；②任意 5 个整数中必存在 2 个数之差是 4 的倍数（按 mod 4 余数分 4 个鸽巢）；③图论中简单图必有两个同度顶点。关键在于构造合适的"鸽巢"。',
      },
      {
        name: '隔板法（方程非负整数解）',
        latex: 'x_1 + x_2 + \\cdots + x_k = n \\text{ 的非负整数解个数} = \\binom{n+k-1}{k-1}',
        note: 'n 个球 + k−1 个隔板的排列。若要求正整数解，先令 y_i=x_i−1 转化。',
        detail: '模型：n 个相同的球放入 k 个不同的盒子（可空）。等价于在 n 个球排成的序列中插入 k-1 个隔板——共 n+k-1 个位置选 k-1 个放隔板。若要求正整数解（每盒非空）：先给每盒放 1 个球（共 k 个），剩余 n-k 个球可空放置 → C((n-k)+k-1, k-1) = C(n-1, k-1)。典型题：n 个相同糖果分给 k 个小朋友的分配方案数。',
      },
      {
        name: '递推关系',
        latex: 'a_n = c_1 a_{n-1} + \\cdots + c_k a_{n-k} \\xrightarrow{\\lambda^k = c_1\\lambda^{k-1}+\\cdots+c_k} a_n = \\sum C_i \\lambda_i^n',
        note: '常系数线性递推 → 特征方程 → 特征根 → 通解。斐波那契：F_n=F_{n-1}+F_{n-2}。',
        detail: '解法与常系数线性微分方程完全类似：①写出特征方程 λ^k = c₁λ^{k-1}+...+c_k；②解特征根；③通解 a_n = ΣC_i λ_i^n（无重根时）。斐波那契数列 F_n=F_{n-1}+F_{n-2}：特征方程 λ²=λ+1 → λ=(1±√5)/2，通解 F_n = Aφ^n+Bψ^n，代入初始条件 F₀=0,F₁=1 可得通项公式。有重根时解的形式类似微分方程：λ 为 r 重根时对应项为 n^{r-1}λ^n。',
      },
    ],
  },

  // ===== 概率论与数理统计 =====
  'prob-basic': {
    id: 'prob-basic',
    title: '概率公式与事件',
    subject: '概率统计',
    formulas: [
      {
        name: '条件概率',
        latex: 'P(B \\mid A) = \\frac{P(AB)}{P(A)},\\quad P(A) > 0',
        note: '在 A 发生的条件下 B 发生的概率。乘法公式：P(AB) = P(A)·P(B|A)。',
        detail: '条件概率重新定义了样本空间——将样本空间从 Ω 缩小到 A。乘法公式推广（链式法则）：P(A₁A₂...A_n) = P(A₁)·P(A₂|A₁)·P(A₃|A₁A₂)·...·P(A_n|A₁...A_{n-1})。注意：P(B|A) 与 P(A|B) 一般不相等，二者通过贝叶斯公式联系。条件概率满足概率的三条公理（非负、规范、可列可加），因此可以当作普通概率使用。',
        level: 'important',
      },
      {
        name: '全概率公式',
        latex: 'P(B) = \\sum_{i=1}^{n} P(A_i) \\cdot P(B \\mid A_i)',
        note: 'A_i 是完备事件组（互斥且并=Ω）。"分情况讨论"的概率版本，期末考试必考。',
        detail: '使用前提：A₁,...,A_n 是样本空间的划分（互斥且 ∪A_i = Ω，P(A_i)>0）。核心思想：将复杂事件 B 按照 A_i 分类，分别计算每类中的概率再加权求和。典型应用题：工厂有多条生产线，各线产量占比不同、次品率不同，求随机抽一件是次品的概率。步骤：①确定划分 A_i；②分别求 P(A_i) 和 P(B|A_i)；③带入全概率公式。',
        level: 'important',
      },
      {
        name: '贝叶斯公式',
        latex: 'P(A_k \\mid B) = \\frac{P(A_k)P(B \\mid A_k)}{\\sum_{i=1}^{n} P(A_i)P(B \\mid A_i)}',
        note: '"结果已知，反推原因"的公式。分子=先验×似然，分母=全概率。',
        detail: '贝叶斯公式是全概率公式的逆运算：已知结果 B 发生了，求某个原因 A_k 的后验概率。分子是 A_k 和 B 的联合概率 P(A_k)·P(B|A_k)，分母是 B 的全概率。典型题：已知检测阳性，求真正患病的概率（需要考虑假阳性率）。先验概率 P(A_k) 是历史经验，后验概率 P(A_k|B) 是结合新证据后的更新。贝叶斯统计的核心思想：用新数据更新信念。',
        level: 'important',
      },
      {
        name: '事件独立性',
        latex: 'A,B \\text{ 独立} \\iff P(AB) = P(A)P(B)',
        note: '独立 ≠ 互斥！独立是概率等式，互斥是集合不相交。三个事件两两独立 ≠ 相互独立。',
        detail: '独立性的直观含义：一个事件的发生不影响另一个事件的概率，即 P(B|A)=P(B)（或 P(A|B)=P(A)）。注意区分：①互斥（A∩B=∅）→ P(AB)=0，除非 P(A) 或 P(B)=0，互斥一般不独立；②独立 → P(AB)=P(A)P(B)，但 A 和 B 可以有交集。n 个事件相互独立需要 2^n-n-1 个等式同时成立（所有子集的乘积等式），两两独立只是其中一部分，不足以保证相互独立。',
        level: 'basic',
      },
      {
        name: '三大常用概率不等式',
        latex: '\\begin{aligned} &P(A \\cup B) \\leq P(A) + P(B) \\\\ &P(\\bigcup A_i) \\leq \\sum P(A_i) \\\\ &P(A) = 1 - P(\\overline{A}) \\end{aligned}',
        note: '布尔不等式：和的概率 ≤ 概率的和。对立事件公式极其实用（有时算反面更简单）。',
        detail: '对立事件公式 P(A)=1-P(Ā) 是最常用的技巧：当直接算"至少有一个…"很复杂时，先算"一个都没有"再用 1 减。例如：n 个人中至少两人同生日的概率 = 1 - P(所有人生日都不同)。布尔不等式（Union Bound）虽然松，但无需考虑事件间的相关性，在推导中常用。当事件互斥时，不等式取等号（概率的可加性）。',
        level: 'basic',
      },
    ],
  },

  'prob-dist': {
    id: 'prob-dist',
    title: '常见分布',
    subject: '概率统计',
    formulas: [
      {
        name: '二项分布 B(n, p)',
        latex: 'P(X=k) = \\binom{n}{k} p^k (1-p)^{n-k},\\quad E(X)=np,\\ D(X)=np(1-p)',
        note: 'n 次独立重复试验中成功次数的分布。0-1 分布是 n=1 的特例。',
        detail: '二项分布的四个条件：①试验次数 n 固定；②每次试验独立；③每次只有成功/失败两种结果；④每次成功概率 p 不变。当 n 很大时计算不便，可用泊松近似（n→∞, p→0, np=λ 固定）或正态近似（np≥5 且 n(1-p)≥5）。二项分布是可加的：X~B(n₁,p) 与 Y~B(n₂,p) 独立，则 X+Y~B(n₁+n₂,p)。',
        level: 'important',
      },
      {
        name: '泊松分布 P(λ)',
        latex: 'P(X=k) = \\frac{\\lambda^k e^{-\\lambda}}{k!},\\ k=0,1,2,\\dots,\\quad E(X)=\\lambda,\\ D(X)=\\lambda',
        note: '描述单位时间内随机事件发生次数的分布。λ 既是期望也是方差。',
        detail: '泊松分布适用于：电话交换机呼叫次数、网页访问量、放射性衰变计数等"稀有事件"。条件：事件独立发生、平均发生率恒定、同一瞬间发生两件事的概率为 0。泊松分布的期望=方差=λ 是重要特征。当 n 很大 p 很小且 np=λ 适中时，二项分布可用泊松近似：C(n,k)p^k(1-p)^{n-k} ≈ λ^k e^{-λ}/k!（通常 n≥20, p≤0.05 可用）。',
        level: 'important',
      },
      {
        name: '正态分布 N(μ, σ²)',
        latex: 'f(x) = \\frac{1}{\\sqrt{2\\pi}\\sigma} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}},\\quad E(X)=\\mu,\\ D(X)=\\sigma^2',
        note: '最重要的连续分布！标准化：Z=(X−μ)/σ ~ N(0,1)。查标准正态分布表解题。',
        detail: '正态分布是概率论的核心——中心极限定理保证了大量独立随机变量之和近似正态。性质：①关于 x=μ 对称钟形曲线；②σ 越大越扁平；③68-95-99.7 法则：P(μ±σ)≈68%, P(μ±2σ)≈95%, P(μ±3σ)≈99.7%。标准化变换 Z=(X-μ)/σ 是解题关键步骤：先将一般正态转化为标准正态 N(0,1)，再查表。注意：Φ(-z)=1-Φ(z)，P(a<X<b)=Φ((b-μ)/σ)-Φ((a-μ)/σ)。',
        level: 'important',
      },
      {
        name: '均匀分布 U(a, b)',
        latex: 'f(x) = \\begin{cases} \\frac{1}{b-a} & a < x < b \\\\ 0 & \\text{其他} \\end{cases},\\quad E(X)=\\frac{a+b}{2},\\ D(X)=\\frac{(b-a)^2}{12}',
        note: '区间上等可能分布。几何概率中随机投点对应均匀分布。',
        detail: '均匀分布是最简单的连续分布。期望 = 区间中点 (a+b)/2，方差 = (b-a)²/12。分布函数 F(x) = (x-a)/(b-a)（a<x<b）。均匀分布在随机模拟（Monte Carlo）中极其重要——通过均匀分布的随机数可以生成任意分布的随机数（逆变换法）。几何概型中，随机向 [a,b] 区间投一点，该点坐标 ~ U(a,b)。',
        level: 'basic',
      },
      {
        name: '指数分布 Exp(λ)',
        latex: 'f(x) = \\begin{cases} \\lambda e^{-\\lambda x} & x \\geq 0 \\\\ 0 & x < 0 \\end{cases},\\quad E(X)=\\frac{1}{\\lambda},\\ D(X)=\\frac{1}{\\lambda^2}',
        note: '描述等待时间的分布。无记忆性：P(X>s+t|X>s)=P(X>t)。指数分布是唯一具有无记忆性的连续分布。',
        detail: '指数分布常用于：电子元件寿命、排队论中的服务时间、放射性衰变时间。无记忆性是核心特征：如果 X 表示灯泡寿命，已知已经亮了 s 小时，剩余寿命仍服从同样的指数分布（不因已使用时长而加速老化）。期望 = 1/λ，λ 越大→平均等待时间越短。指数分布与泊松分布的关系：泊松过程的事件到达时间间隔 ~ Exp(λ)。分布函数 F(x)=1-e^{-λx}（x≥0）。',
        level: 'important',
      },
      {
        name: 'χ² 分布（卡方分布）',
        latex: '\\text{若 } X_i \\sim N(0,1) \\text{ 独立，则 } \\chi^2 = \\sum_{i=1}^{n} X_i^2 \\sim \\chi^2(n),\\quad E(\\chi^2)=n,\\ D(\\chi^2)=2n',
        note: 'n 个独立标准正态的平方和。自由度 n 决定形状，n→∞ 趋近正态。用于方差检验和拟合优度。',
        detail: 'χ² 分布是统计推断三大分布之一。关键性质：①n 个独立 N(0,1) 的平方和 ~ χ²(n)；②E(χ²)=n，D(χ²)=2n；③可加性：若 U~χ²(m), V~χ²(n) 独立，则 U+V~χ²(m+n)；④样本方差 (n-1)S²/σ² ~ χ²(n-1)（这是正态总体下方差推断的基础）；⑤n→∞ 时 χ²(n) 近似 N(n, 2n)。上侧分位点 χ²_α(n) 查表可得。注意：χ² 分布不对称、非负。',
        level: 'important',
      },
      {
        name: 't 分布（学生分布）',
        latex: 'T = \\frac{X}{\\sqrt{Y/n}} \\sim t(n),\\quad X \\sim N(0,1),\\ Y \\sim \\chi^2(n),\\ X \\perp Y',
        note: '标准正态除以独立卡方均值的平方根。n→∞ 时趋近 N(0,1)。用于均值检验（σ²未知）。',
        detail: 't 分布是 W.S. Gosset（笔名 Student）推导的。构造：分子是标准正态，分母是独立 χ² 除以自由度的平方根。性质：①关于 0 对称钟形；②尾部比正态厚（自由度越小越厚）；③ET=0 (n>1)，DT=n/(n-2) (n>2)；④n→∞ 时 t(n)→N(0,1)，n≥30 即可用正态近似；⑤应用：σ² 未知时的单样本/双样本均值检验、回归系数检验。与正态的关系：t 检验更保守（临界值更大），小样本时必须用 t 而非 Z。',
        level: 'important',
      },
      {
        name: 'F 分布',
        latex: 'F = \\frac{U/m}{V/n} \\sim F(m,n),\\quad U \\sim \\chi^2(m),\\ V \\sim \\chi^2(n),\\ U \\perp V',
        note: '两个独立卡方除以各自自由度的比值。用于方差比检验、ANOVA 和回归显著性检验。',
        detail: 'F 分布由两个独立的 χ² 变量构造：分子自由度 m（第一自由度），分母自由度 n（第二自由度）。性质：①非负、右偏长尾；②若 F~F(m,n)，则 1/F~F(n,m)；③F(1,n) = t²(n)（t 分布平方即 F 分布特例）；④E(F)=n/(n-2) (n>2)。应用：①两正态总体方差比检验（F 检验）；②方差分析 ANOVA（组间/组内均方比）；③回归方程整体显著性检验（F 检验）。查表需要两个自由度参数。',
        level: 'important',
      },
    ],
  },

  'prob-numeric': {
    id: 'prob-numeric',
    title: '数字特征与极限定理',
    subject: '概率统计',
    formulas: [
      {
        name: '期望与方差',
        latex: '\\begin{aligned} E(X) &= \\sum x_k p_k \\ \\text{或} \\ \\int x f(x)dx \\\\ D(X) &= E[(X-EX)^2] = E(X^2) - [E(X)]^2 \\end{aligned}',
        note: '期望=加权平均，方差=偏离期望的程度。方差公式 D(X)=E(X²)−(EX)² 常用于计算。',
        detail: '期望的性质：①E(aX+b)=aEX+b；②E(X+Y)=EX+EY（始终成立，无论是否独立）；③若 X,Y 独立则 E(XY)=EX·EY。方差的性质：①D(aX+b)=a²D(X)（注意系数平方！常数 b 不影响方差）；②若 X,Y 独立则 D(X±Y)=D(X)+D(Y)（独立时加减方差都是加！）；③常数的方差为 0；④D(X)=0 ⟺ P(X=c)=1。标准化变量 X*=(X-EX)/√DX 满足 E(X*)=0, D(X*)=1。',
        level: 'important',
      },
      {
        name: '协方差与相关系数',
        latex: '\\begin{aligned} \\mathrm{Cov}(X,Y) &= E[(X-EX)(Y-EY)] = E(XY) - EX \\cdot EY \\\\ \\rho_{XY} &= \\frac{\\mathrm{Cov}(X,Y)}{\\sqrt{DX}\\sqrt{DY}},\\quad |\\rho| \\leq 1 \\end{aligned}',
        note: '协方差衡量线性相关性。ρ=0（不相关）≠ 独立，但对二元正态等价。',
        detail: '协方差的性质：①Cov(X,X)=D(X)；②Cov(X,Y)=Cov(Y,X)；③Cov(aX+b, cY+d)=ac·Cov(X,Y)；④Cov(X+Y,Z)=Cov(X,Z)+Cov(Y,Z)。相关系数 ρ 是标准化后的协方差，衡量线性相关程度：ρ=±1 ⟺ Y 与 X 几乎处处呈完美线性关系（Y=aX+b, a≠0）；ρ>0 正相关，ρ<0 负相关，ρ=0 不相关。重要区别：独立 ⇒ 不相关（ρ=0），但不相关 ⇏ 独立！例如 X~N(0,1), Y=X²，则 Cov(X,Y)=0 但显然不独立。',
        level: 'important',
      },
      {
        name: '切比雪夫不等式',
        latex: 'P(|X - \\mu| \\geq \\varepsilon) \\leq \\frac{\\sigma^2}{\\varepsilon^2} \\quad\\text{或}\\quad P(|X - \\mu| < \\varepsilon) \\geq 1 - \\frac{\\sigma^2}{\\varepsilon^2}',
        note: '对任意分布成立（只要方差存在）。界较松，但无需知道分布形式。',
        detail: '切比雪夫不等式给出了"偏离期望超过 ε"的概率上界，只依赖方差不依赖分布形式——非常通用但也比较保守。等价的两种写法：①P(|X-μ|≥ε)≤σ²/ε²；②P(|X-μ|<ε)≥1-σ²/ε²。应用：①估计概率范围；②证明大数定律（取 ε 足够小，概率趋于 1）；③确定需要的样本量。注意：当 ε≤σ 时不等式给出的上界 ≥ 1，没有实际信息量。',
        level: 'advanced',
      },
      {
        name: '大数定律（辛钦）',
        latex: '\\bar{X}_n = \\frac{1}{n}\\sum_{i=1}^{n} X_i \\xrightarrow{P} \\mu,\\quad n\\to\\infty',
        note: '样本均值依概率收敛于总体期望。解释"频率趋近概率"的数学基础。',
        detail: '辛钦大数定律的条件：X_i 独立同分布且期望 EX=μ 存在（不需要方差存在！）。结论：对任意 ε>0，lim P(|X̄_n-μ|<ε)=1。依概率收敛 ≠ 几乎处处收敛：前者允许在概率为 0 的样本点上不收敛。大数定律解释了：①为什么大量重复试验中频率会稳定在概率附近；②蒙特卡洛方法的理论基础——用大量随机样本均值近似积分值。注意：弱大数定律（依概率收敛）和强大数定律（几乎处处收敛）的区别。',
        level: 'important',
      },
      {
        name: '中心极限定理（林德伯格-莱维）',
        latex: '\\frac{\\sum X_i - n\\mu}{\\sqrt{n}\\sigma} = \\frac{\\bar{X}_n - \\mu}{\\sigma/\\sqrt{n}} \\xrightarrow{d} N(0,1)',
        note: '无论 X_i 原来是什么分布（只要方差有限），样本均值的标准化逼近标准正态！概率论最重要的定理。',
        detail: '中心极限定理（CLT）是概率论最重要的定理之一。条件：独立同分布，期望 μ 和方差 σ² 都存在。结论：当 n 足够大时，X̄_n 近似 ~ N(μ, σ²/n)。实用规则：n≥30 一般就可用正态近似（若原分布对称光滑更快；若严重偏态需要更大 n）。应用：①二项分布正态近似（np,n(1-p)≥5 时）；②求样本均值的置信区间；③质量控制中的 X̄ 控制图。棣莫弗-拉普拉斯是 CLT 的特例：二项分布的正态近似。',
        level: 'important',
      },
    ],
  },

  'prob-estimate': {
    id: 'prob-estimate',
    title: '参数估计与假设检验',
    subject: '概率统计',
    formulas: [
      {
        name: '矩估计法',
        latex: '\\begin{aligned} &\\text{令样本矩 = 总体矩：} \\\\ &\\frac{1}{n}\\sum X_i = E(X),\\ \\frac{1}{n}\\sum X_i^2 = E(X^2),\\ \\dots \\end{aligned}',
        note: '用样本矩代替总体矩，解出参数估计量。直观但效率不是最优。',
        detail: '矩估计基本思想：样本来自总体，样本数字特征应接近总体数字特征。步骤：①计算总体矩 μ_k(θ)=E(X^k)（k=1,2,...）；②计算对应样本矩 A_k=(1/n)ΣX_i^k；③令 μ_k(θ)=A_k，解方程组得 θ̂（矩估计量）。需要估计 k 个参数就列 k 个方程。矩估计通常计算简单，但可能得不出估计量或估计量不在合理范围内（如方差为负）。矩估计的优良性一般不如极大似然估计。',
        level: 'important',
      },
      {
        name: '极大似然估计（MLE）',
        latex: 'L(\\theta) = \\prod_{i=1}^{n} f(x_i;\\theta) \\ \\xrightarrow{\\text{取 ln}} \\ \\frac{d\\ln L}{d\\theta} = 0 \\ \\Rightarrow \\hat{\\theta}_{MLE}',
        note: '选择使"观察到当前样本的概率最大"的参数值。先写似然函数 L(θ)，取对数后求导。',
        detail: '极大似然估计是应用最广的参数估计方法，具有优良的大样本性质（一致性、渐近正态性、渐近有效性）。步骤：①写出似然函数 L(θ)=Πf(x_i;θ)（离散则为 ΠP(X=x_i)）；②取对数 ln L = Σ ln f(x_i;θ)；③求导 d(ln L)/dθ=0，解出 θ̂；④验证二阶导 < 0 确认为最大值。多参数时令偏导均为 0 联立求解。注意：似然函数是参数的函数（样本视为固定），与概率密度函数视角相反。',
        level: 'important',
      },
      {
        name: '置信区间（σ² 已知时的 μ）',
        latex: '\\bar{X} \\pm z_{\\alpha/2} \\cdot \\frac{\\sigma}{\\sqrt{n}},\\quad P(|Z| < z_{\\alpha/2}) = 1-\\alpha',
        note: '95% 置信区间：X̄ ± 1.96·σ/√n。z_{0.025}=1.96, z_{0.05}=1.645。',
        detail: '置信区间的解读：如果重复抽样 100 次，得到 100 个置信区间，期望有 95 个包含真实参数 μ——而不是"μ 以 95% 概率落在该区间"（μ 是常数不是随机变量）。影响区间宽度的因素：①置信水平 1-α ↑ → 区间变宽；②样本量 n ↑ → 区间变窄（精度 √n 倍）；③总体标准差 σ ↑ → 区间变宽。σ² 未知时用 t 分布：X̄ ± t_{α/2}(n-1)·S/√n（t 界值比 z 大，区间更宽）。',
        level: 'important',
      },
      {
        name: '假设检验基本流程',
        latex: '\\begin{aligned} &\\text{① 设 } H_0, H_1 \\quad \\text{② 选统计量} \\\\ &\\text{③ 定拒绝域} \\quad \\text{④ 计算统计量值} \\\\ &\\text{⑤ 决策：若落入拒绝域则拒绝 } H_0 \\end{aligned}',
        note: '两类错误：弃真（α，第Ⅰ类）和存伪（β，第Ⅱ类）。通常控制 α=0.05。拒绝域由 α 决定。',
        detail: '假设检验的核心逻辑：先假设 H_0 成立，看样本数据是否"太离谱"——如果样本结果在 H_0 下出现概率 ≤ α，则拒绝 H_0。关键概念：①p 值：在 H_0 成立下，观察到当前或更极端结果的概率；p<α 则拒绝 H_0；②拒绝域：统计量落到该范围即拒绝 H_0；③两类错误权衡：减小 α 则 β 增大（除非增大样本量）。常见检验：Z 检验（σ 已知，检验均值）、t 检验（σ 未知，检验均值）、χ² 检验（检验方差）。',
        level: 'important',
      },
      {
        name: '单正态总体均值的 Z 检验与 t 检验',
        latex: '\\begin{aligned} &\\sigma^2 \\text{ 已知：} Z = \\frac{\\bar{X} - \\mu_0}{\\sigma/\\sqrt{n}} \\sim N(0,1) \\\\ &\\sigma^2 \\text{ 未知：} T = \\frac{\\bar{X} - \\mu_0}{S/\\sqrt{n}} \\sim t(n-1) \\end{aligned}',
        note: 'Z 检验用正态表，t 检验用 t 分布表。n≥30 时 t 近似于 Z。',
        detail: '检验均值的三类拒绝域（以 H₀: μ=μ₀ 为例）：①H₁: μ≠μ₀ → 双侧检验，|Z|>z_{α/2} 拒绝；②H₁: μ>μ₀ → 右侧检验，Z>z_α 拒绝；③H₁: μ<μ₀ → 左侧检验，Z<-z_α 拒绝。t 检验临界值查 t(n-1) 表，自由度 n-1。t 分布比正态分布尾部更厚（自由度越小越厚），n→∞ 时趋于正态。实际中 σ 通常未知，所以 t 检验比 Z 检验更常用。注意：t 检验要求总体服从正态分布（或 n 足够大由 CLT 保证近似）。',
        level: 'important',
      },
    ],
  },

  'prob-multivariate': {
    id: 'prob-multivariate',
    title: '多维随机变量',
    subject: '概率统计',
    formulas: [
      {
        name: '联合分布与边缘分布',
        latex: '\\begin{aligned} &F(x,y) = P(X \\leq x, Y \\leq y) \\\\ &F_X(x) = F(x,+\\infty),\\quad F_Y(y) = F(+\\infty,y) \\\\ &\\text{离散：} p_{i\\cdot} = \\sum_j p_{ij},\\quad p_{\\cdot j} = \\sum_i p_{ij} \\end{aligned}',
        note: '边缘分布 = 联合分布对另一个变量"求和/积分"消去。联合分布唯一确定边缘，反之不成立！',
        detail: '联合分布完整描述了 (X,Y) 的概率行为。从联合分布得到边缘分布的方法：离散型 → 对行/列求和（p_i· = Σ_j p_ij，p_·j = Σ_i p_ij）；连续型 → 对另一个变量积分（f_X(x)=∫f(x,y)dy）。重要警告：边缘分布不能唯一确定联合分布！例如两个不同的联合分布可能有完全相同的边缘分布——因为它们有不同的"关联结构"（用 copula 描述）。',
        level: 'important',
      },
      {
        name: '条件分布与独立性判定',
        latex: '\\begin{aligned} &P(Y=y \\mid X=x) = \\frac{P(X=x,Y=y)}{P(X=x)} = \\frac{p_{ij}}{p_{i\\cdot}} \\\\ &X \\perp\\!\\!\\!\\perp Y \\iff F(x,y) = F_X(x)F_Y(y) \\iff f(x,y)=f_X(x)f_Y(y) \\iff p_{ij}=p_{i\\cdot}p_{\\cdot j} \\end{aligned}',
        note: '条件分布 = 联合/边缘。独立 ⟺ 联合 = 边缘乘积（对所有 x,y 成立）。',
        detail: '条件分布描述了在已知 X=x 的条件下 Y 的分布。关键公式：条件概率密度 f_{Y|X}(y|x) = f(x,y)/f_X(x)（连续型）。独立性的等价判定：①联合 = 边缘乘积（对任意 x,y）；②条件分布 = 无条件分布（给定 X 不影响 Y）；③对任意函数 g,h，E[g(X)h(Y)] = E[g(X)]E[h(Y)]。注意：两两独立 ≠ 相互独立（三个变量两两独立不保证三者独立）。独立 ⟺ 协方差为 0 在一般情况只是必要不充分条件。',
        level: 'important',
      },
      {
        name: '二维均匀分布与二维正态分布',
        latex: '\\begin{aligned} &\\text{二维均匀 } U(D): f(x,y) = \\begin{cases} \\frac{1}{|D|} & (x,y) \\in D \\\\ 0 & \\text{其他} \\end{cases} \\\\ &\\text{二维正态 } N(\\mu_1,\\mu_2,\\sigma_1^2,\\sigma_2^2,\\rho): f(x,y) = \\frac{1}{2\\pi\\sigma_1\\sigma_2\\sqrt{1-\\rho^2}} \\exp\\!\\left(-\\frac{1}{2(1-\\rho^2)}\\left[\\frac{(x-\\mu_1)^2}{\\sigma_1^2} - 2\\rho\\frac{(x-\\mu_1)(y-\\mu_2)}{\\sigma_1\\sigma_2} + \\frac{(y-\\mu_2)^2}{\\sigma_2^2}\\right]\\right) \\end{aligned}',
        note: '二维均匀：有界区域上等可能；二维正态由 5 个参数唯一确定。ρ=0 ⟺ 独立（仅二维正态成立）。',
        detail: '二维均匀分布是有界区域 D 上的连续均匀分布，概率与面积成正比。二维正态分布由 5 个参数完全确定：(μ₁,μ₂,σ₁²,σ₂²,ρ)。关键性质：①边缘分布：X~N(μ₁,σ₁²)，Y~N(μ₂,σ₂²)（均为正态）；②条件分布也是正态：Y|X=x ~ N(μ₂+ρ(σ₂/σ₁)(x-μ₁), σ₂²(1-ρ²))；③ρ=0 ⟺ X 与 Y 独立（二维正态独有的性质，一般不成立！）；④线性组合仍正态：aX+bY ~ N(aμ₁+bμ₂, a²σ₁²+b²σ₂²+2abρσ₁σ₂)。',
        level: 'advanced',
      },
      {
        name: '协方差矩阵',
        latex: '\\Sigma = \\begin{pmatrix} D(X) & \\operatorname{Cov}(X,Y) \\\\ \\operatorname{Cov}(Y,X) & D(Y) \\end{pmatrix} = \\begin{pmatrix} \\sigma_X^2 & \\rho\\sigma_X\\sigma_Y \\\\ \\rho\\sigma_X\\sigma_Y & \\sigma_Y^2 \\end{pmatrix}',
        note: '对称半正定矩阵，对角元依次为各变量方差，非对角元为协方差。多维正态由此完全刻画。',
        detail: '协方差矩阵 Σ 是多维随机变量最核心的数字特征：①对称：Σ^T = Σ；②半正定：x^T Σx ≥ 0（这保证了相关系数 |ρ|≤1 对任意维数都成立）；③对角元 = 各方差 σ_i²，非对角元 = Cov(X_i, X_j)。对多维正态 N(μ, Σ)，均值向量 μ 和协方差矩阵 Σ 完全决定了分布。线性变换的性质：若 Y = A X + b，则 Cov(Y) = A Σ A^T。这是传播误差/不确定性的重要公式。',
        level: 'important',
      },
      {
        name: '两个随机变量和的分布（卷积）',
        latex: 'Z = X + Y,\\quad f_Z(z) = \\int_{-\\infty}^{\\infty} f(x, z-x)\\,dx \\ \\xrightarrow{X \\perp Y}\\ \\int_{-\\infty}^{\\infty} f_X(x)f_Y(z-x)\\,dx',
        note: '独立时化为卷积 f_Z = f_X * f_Y。离散类似：P(Z=z) = Σ P(X=k)P(Y=z-k)。',
        detail: '卷积公式是求独立随机变量之和分布的核心工具。步骤：①书写联合密度（独立时 = f_X(x)f_Y(y)）；②做变换（z=x+y, w=x 或 w=y）；③计算雅可比行列式；④对多余变量积分得到 Z 的边际密度。特殊情形：①独立正态之和仍正态：N(μ₁,σ₁²)+N(μ₂,σ₂²)=N(μ₁+μ₂,σ₁²+σ₂²)；②独立泊松之和仍泊松：P(λ₁)+P(λ₂)=P(λ₁+λ₂)；③独立二项之和（同 p）仍二项：B(m,p)+B(n,p)=B(m+n,p)。离散情形直接用全概率公式：P(Z=k)=Σ_i P(X=i)P(Y=k-i)。',
        level: 'advanced',
      },
    ],
  },

  'prob-regression': {
    id: 'prob-regression',
    title: '方差分析与回归',
    subject: '概率统计',
    formulas: [
      {
        name: '一元线性回归（最小二乘估计）',
        latex: '\\begin{aligned} &y = a + bx + \\varepsilon,\\quad \\varepsilon \\sim N(0,\\sigma^2) \\\\ &\\hat{b} = \\frac{\\sum (x_i-\\bar{x})(y_i-\\bar{y})}{\\sum (x_i-\\bar{x})^2} = \\frac{S_{xy}}{S_{xx}},\\quad \\hat{a} = \\bar{y} - \\hat{b}\\bar{x} \\\\ &S_{xx} = \\sum x_i^2 - n\\bar{x}^2,\\ S_{yy} = \\sum y_i^2 - n\\bar{y}^2,\\ S_{xy} = \\sum x_i y_i - n\\bar{x}\\bar{y} \\end{aligned}',
        note: 'b̂ = S_xy/S_xx 是最小化残差平方和的结果。â 保证回归线过 (x̄, ȳ)。手算用 S 公式更简便。',
        detail: '最小二乘法的核心：选择 a,b 使 Σ(y_i - a - bx_i)² 最小。b̂ = S_xy/S_xx 是核心公式。回归直线性质：①过点 (x̄, ȳ)；②Σ(y_i-ŷ_i)=0（残差和为零）；③Σ x_i(y_i-ŷ_i)=0。计算技巧：先求 x̄, ȳ, Σx_i², Σy_i², Σx_iy_i，再用 S 公式求 b̂。典型题型：给 5 组数据 (x,y)，求回归方程并预测 x=某值时 y 的值。',
        level: 'important',
      },
      {
        name: '判定系数 R²（拟合优度）',
        latex: 'R^2 = \\frac{SSR}{SST} = \\frac{\\sum (\\hat{y}_i - \\bar{y})^2}{\\sum (y_i - \\bar{y})^2} = 1 - \\frac{SSE}{SST},\\quad 0 \\leq R^2 \\leq 1',
        note: 'R² = 回归解释的变异比例。R² 越接近 1 拟合越好。一元回归 R² = r²（相关系数平方）。',
        detail: '平方和分解：SST = SSR + SSE。总变异 SST = Σ(y_i-ȳ)²，回归解释 SSR = Σ(ŷ_i-ȳ)²，残差 SSE = Σ(y_i-ŷ_i)²。R² = SSR/SST 衡量回归线解释了多少比例的 y 的变异。重要关系：一元线性回归中 R² = r²（皮尔逊相关系数的平方）。注意：R² 永远不会因为增加自变量而减小（即使加的是噪声变量），调整 R² (Adjusted R²) 考虑了变量个数的惩罚。',
        level: 'important',
      },
      {
        name: '回归系数的显著性检验（t 检验）',
        latex: 'T = \\frac{\\hat{b}}{S_b} \\sim t(n-2),\\quad S_b = \\frac{S}{\\sqrt{S_{xx}}},\\ S^2 = \\frac{SSE}{n-2}',
        note: '检验 H₀: b=0 vs H₁: b≠0。若 |T| > t_{α/2}(n-2)，拒绝 H₀ → 回归效果显著。',
        detail: 'b̂ 的方差估计：Var(b̂) = σ²/S_xx，σ² 的无偏估计 S² = SSE/(n-2)（n-2 是自由度）。b̂ 的标准化 T 统计量 ~ t(n-2)。显著性检验：①H₀: b=0（x 对 y 无线性影响）；②计算 T = b̂/S_b；③比较临界值 t_{α/2}(n-2)。若拒绝 H₀，说明 x 对 y 有显著的线性影响。同时可构造 b 的置信区间：b̂ ± t_{α/2}(n-2)·S_b。',
        level: 'important',
      },
      {
        name: '单因素方差分析（ANOVA）',
        latex: '\\begin{aligned} &F = \\frac{MSA}{MSE} = \\frac{SSA/(k-1)}{SSE/(n-k)} \\sim F(k-1, n-k) \\\\ &SST = SSA + SSE \\end{aligned}',
        note: '检验 k 个组的均值是否有显著差异。组间变异 vs 组内变异。F 值越大越显著。',
        detail: '单因素 ANOVA 检验 H₀: μ₁=μ₂=...=μ_k vs H₁: 至少两个均值不等。总变异 SST 分解为：组间变异 SSA（factor 解释）+ 组内变异 SSE（随机误差）。F = MSA/MSE = (SSA/(k-1))/(SSE/(n-k))，若 F > F_α(k-1, n-k)，拒绝 H₀。关键假设：①各组独立；②正态性；③方差齐性（各组方差相等）。典型应用：比较三种教学方法的效果差异是否显著。',
        level: 'important',
      },
      {
        name: 'F 检验与回归方程整体显著性',
        latex: 'F = \\frac{SSR}{SSE/(n-2)} = \\frac{MSR}{MSE} \\sim F(1, n-2)',
        note: '检验整个回归方程是否显著（H₀: b=0）。一元回归中 F = T²，检验结论一致。',
        detail: '对一元线性回归，F 检验和 t 检验等价（F = T²），但 F 检验可推广到多元。方差分析表：来源(回归/残差/总计) → 平方和(SSR/SSE/SST) → 自由度(1/n-2/n-1) → 均方(MSR/MSE) → F 值。若 p 值 < α（通常 0.05），说明回归方程整体显著。注意区分：回归显著 ≠ 拟合好（R² 可能很低），显著性只说明 x 与 y 确实存在线性关系。',
        level: 'important',
      },
    ],
  },

  'prob-transform': {
    id: 'prob-transform',
    title: '随机变量函数的分布',
    subject: '概率统计',
    formulas: [
      {
        name: '离散型随机变量函数的分布',
        latex: 'P(g(X)=y) = \\sum_{x: g(x)=y} P(X=x)',
        note: '合并相同函数值的概率。列表法：枚举 X 的取值 → 计算 g(X) → 合并同类值。',
        detail: '求 Y=g(X) 的分布：①写出 X 的分布列；②计算每个 x 对应的 y=g(x)；③对于相同的 y 值合并概率（概率相加）；④按 y 从小到大列出 Y 的分布列。若 g 是一一映射，则 Y 的概率 = X 对应取值的概率。典型题：已知 X~B(n,p)，求 Y=X² 的分布——注意 X 和 -X 可能映射到同一个 Y 值。二元情形类似：Z=g(X,Y)，对每对 (x,y) 算 g 值并合并。',
        level: 'important',
      },
      {
        name: '连续型：分布函数法',
        latex: 'F_Y(y) = P(Y \\leq y) = P(g(X) \\leq y) = \\int_{\\{x: g(x) \\leq y\\}} f_X(x)\\,dx \\quad\\Rightarrow\\quad f_Y(y) = F\'_Y(y)',
        note: '先求分布函数再求导得到密度。适用于任意 g（不要求单调）。',
        detail: '分布函数法是求连续型 r.v. 函数分布的最通用方法。步骤：①F_Y(y)=P(Y≤y)=P(g(X)≤y)；②解不等式 g(x)≤y 得到 x 的范围；③用 X 的密度在范围内积分得到 F_Y(y)；④对 y 求导得到 f_Y(y)=F\'_Y(y)。关键难点在步骤②：如 Y=X²，则 P(X²≤y)=P(-√y≤X≤√y)=F_X(√y)-F_X(-√y)，求导得 f_Y(y)=[f_X(√y)+f_X(-√y)]/(2√y) (y>0)。',
        level: 'important',
      },
      {
        name: '连续型：公式法（单调函数）',
        latex: 'Y = g(X),\\ g \\text{ 严格单调} \\Rightarrow f_Y(y) = f_X(h(y))\\cdot|h\'(y)|,\\quad h = g^{-1}',
        note: 'g 单调 + g⁻¹ 可导时直接用公式！|h\'(y)| 是雅可比（一维）。注意绝对值。',
        detail: '公式法比分布函数法更快，但仅适用于 g 严格单调的情形。若 g 递增：f_Y(y)=f_X(h(y))·h\'(y)；若 g 递减：h\'(y)<0，取绝对值后仍为正。经典例子：Y=aX+b (a≠0) → f_Y(y)=f_X((y-b)/a)·1/|a|。若 g 非单调（如 Y=X²），需分段：将定义域按单调性分成多段，每段用公式法再相加：f_Y(y)=Σ f_X(h_i(y))·|h\'_i(y)|，其中 h_i 是各单调分支的反函数。',
        level: 'important',
      },
      {
        name: '次序统计量的分布',
        latex: '\\begin{aligned} &X_{(k)} \\text{（第 } k \\text{ 小的次序统计量）密度：} \\\\ &f_{X_{(k)}}(x) = \\frac{n!}{(k-1)!(n-k)!} [F(x)]^{k-1}[1-F(x)]^{n-k}f(x) \\end{aligned}',
        note: '极大值 X_{(n)}: F_max(x)=[F(x)]ⁿ；极小值 X_{(1)}: F_min(x)=1-[1-F(x)]ⁿ。',
        detail: '次序统计量在可靠性、风险管理中很关键。n 个独立同分布样本排序后得 X_{(1)}≤X_{(2)}≤...≤X_{(n)}。极值分布公式最简单：最大值 ≤ x ⟺ 所有都 ≤ x ⟺ F_max(x)=F(x)^n；最小值 > x ⟺ 所有都 > x ⟺ F_min(x)=1-(1-F(x))^n。中位数、四分位数属于次序统计量。次序统计量的联合分布也经常考察：f(x_{(i)},x_{(j)}) 涉及两个值的联合密度。',
        level: 'advanced',
      },
    ],
  },

  'disc-boolean': {
    id: 'disc-boolean',
    title: '布尔代数',
    subject: '离散数学',
    formulas: [
      {
        name: '布尔代数基本定律',
        latex: '\\begin{aligned} &\\text{幂等律：} a+a=a,\\ a\\cdot a=a \\\\ &\\text{吸收律：} a+ab=a,\\ a(a+b)=a \\\\ &\\text{德摩根律：} \\overline{a+b}=\\bar{a}\\cdot\\bar{b},\\ \\overline{a\\cdot b}=\\bar{a}+\\bar{b} \\\\ &\\text{双重否定：} \\overline{\\bar{a}} = a \\end{aligned}',
        note: '布尔代数 = 集合代数 + 命题逻辑的统一抽象。+ 对应 ∪/∨，· 对应 ∩/∧。',
        detail: '布尔代数是满足交换律、分配律、有界律、互补律的代数结构。不仅是命题逻辑和集合论的统一框架，也是数字电路设计的基础。吸收律 a+ab=a 的直观理解：若 a 为真，则 (a 或 (a 且 b)) 必为真——a 完全支配了结果。对偶原理：将 +↔·、0↔1 互换后定律仍成立（如 0-1 律 ↔ 有界律）。布尔代数与布尔环等价（通过 a⊕b = ab̄+āb 和 a∧b = ab）。',
        level: 'basic',
      },
      {
        name: '卡诺图化简（2-4 变量）',
        latex: '\\begin{aligned} &\\text{卡诺图化简口诀：} \\\\ &\\text{圈大圈 → 消去变化量 → 保留不变量 → 写出最简与或式} \\end{aligned}',
        note: '相邻格只有一个变量变化！圈 2ⁿ 个 1 消去 n 个变量。圈越大项越简。',
        detail: '卡诺图化简步骤：①将真值表填入卡诺图（注意格雷码顺序，相邻格仅一位变）；②圈出所有 1（可重叠，圈尽可能大，2/4/8 个）；③每个圈对应一个质蕴含项（消去变化的变量）；④选取最小覆盖得到最简与或式。2 变量：4 格正方形；3 变量：8 格 2×4；4 变量：16 格 4×4。注意卷绕（左右相邻、上下相邻、四角相邻）。无关项 d（don\'t care）可当 0 或 1 用。',
        level: 'basic',
      },
      {
        name: '逻辑门与布尔表达式',
        latex: '\\begin{aligned} &\\text{AND: } F = A \\cdot B \\quad \\text{OR: } F = A + B \\quad \\text{NOT: } F = \\overline{A} \\\\ &\\text{NAND: } F = \\overline{A \\cdot B} \\quad \\text{NOR: } F = \\overline{A + B} \\\\ &\\text{XOR: } F = A \\oplus B = A\\overline{B} + \\overline{A}B \\end{aligned}',
        note: 'NAND/NOR 是功能完备集（可表示任意布尔函数）。实际电路多用 NAND 门。',
        detail: '基本逻辑门：AND（与，·）、OR（或，+）、NOT（非，ˉ）、NAND（与非）、NOR（或非）、XOR（异或，⊕）、XNOR（同或，⊙）。功能完备性：{NAND} 或 {NOR} 单独就能实现所有布尔函数。任何布尔表达式可化为 SOP（与或式）或 POS（或与式）标准形式。逻辑门延时和扇入/扇出是实际电路设计的重要参数。',
        level: 'basic',
      },
      {
        name: '布尔函数的标准形式',
        latex: '\\begin{aligned} &\\text{SOP（最小项之和）：} F = \\sum m(\\text{输出为 1 的行号}) \\\\ &\\text{POS（最大项之积）：} F = \\prod M(\\text{输出为 0 的行号}) \\end{aligned}',
        note: '最小项 m_i：每个变量恰好出现一次（原变量或反变量）的乘积项。最大项是和的因子。',
        detail: '最小项（minterm）m_i：对每个变量组合（取值为 1 用原变量，0 用反变量），全部变量的积。例如三变量中 m₃ (011) = x̄yz。最大项（maxterm）M_i：全部变量的和，例如 M₃ = x+ȳ+z̄。任意布尔函数可以表示为：①最小项之和（SOP，Σ 表示）；②最大项之积（POS，Π 表示）。SOP ↔ POS 可通过取反转化。SOP 更自然（直接从真值表 1 的行写出），也是卡诺图化简的目标形式。',
        level: 'basic',
      },
    ],
  },

  // ===== 数值分析 =====
  'num-interpolation': {
    id: 'num-interpolation',
    title: '插值与逼近',
    subject: '数值分析',
    formulas: [
      {
        name: '拉格朗日插值',
        latex: 'L_n(x) = \\sum_{k=0}^{n} y_k \\cdot \\ell_k(x),\\quad \\ell_k(x) = \\prod_{\\substack{j=0 \\\\ j \\neq k}}^{n} \\frac{x - x_j}{x_k - x_j}',
        note: '给定 n+1 个点，构造唯一的 n 次插值多项式。ℓ_k(x_k)=1, ℓ_k(x_j)=0 (j≠k)。',
        detail: '拉格朗日插值的核心：构造一组基函数 ℓ_k(x)，每个基函数在对应节点处为 1、在其他节点处为 0。最终插值多项式 = Σ y_k·ℓ_k(x)。计算量：O(n²)。优点：公式简洁、理论清晰；缺点：增加节点后需全量重算、高次插值易产生龙格现象。龙格现象：等距节点下高次插值在区间两端剧烈振荡。改进：分段低次插值或切比雪夫节点。',
        level: 'important',
      },
      {
        name: '牛顿插值（差商形式）',
        latex: 'N_n(x) = f[x_0] + f[x_0,x_1](x-x_0) + f[x_0,x_1,x_2](x-x_0)(x-x_1) + \\cdots',
        note: '增加节点只需加一项！差商表：f[x_i,x_j] = (f[x_j]-f[x_i])/(x_j-x_i)，高阶类推。',
        detail: '牛顿插值是拉格朗日插值的另一种等价形式。核心优势：①增加新节点只需在多项式末尾追加一项（拉格朗日需全部重算）；②系数 f[x_0,...,x_k] 通过差商表递推计算；③与泰勒展开形式类似（用差商代替导数）。计算差商表时注意对角线元素就是插值系数。等距节点时使用向前/向后差分公式，计算更简单。',
        level: 'important',
      },
    ],
  },

  'num-integration': {
    id: 'num-integration',
    title: '数值积分',
    subject: '数值分析',
    formulas: [
      {
        name: '梯形公式与复合梯形公式',
        latex: '\\begin{aligned} &\\text{梯形：} \\int_a^b f(x)dx \\approx \\frac{h}{2}[f(a)+f(b)],\\ h=b-a \\\\ &\\text{复合梯形：} \\int_a^b f(x)dx \\approx \\frac{h}{2}\\left[f(a)+f(b)+2\\sum_{i=1}^{n-1} f(x_i)\\right],\\ h=\\frac{b-a}{n} \\end{aligned}',
        note: '线性插值积分。复合公式把区间等分 n 段，每段用梯形近似。误差 O(h²)。',
        detail: '梯形公式 = 用直线段近似曲线，积分 = 梯形面积。复合梯形公式：将 [a,b] 等分为 n 个子区间，每段用梯形公式。收敛阶 O(h²)，即 h 减半→误差减至 1/4。适用：被积函数不太光滑时也能用（低阶方法对光滑性要求低）。与辛普森对比：梯形更稳健但收敛慢。',
        level: 'basic',
      },
      {
        name: '辛普森公式（抛物线公式）',
        latex: '\\int_a^b f(x)dx \\approx \\frac{h}{3}[f(a) + 4f(a+h) + f(b)],\\ h = \\frac{b-a}{2}',
        note: '用二次抛物线近似曲线。三点确定一条抛物线。复合辛普森：n 必须为偶数。误差 O(h⁴)。',
        detail: '辛普森公式（Simpson\'s 1/3 规则）用三点 (a, f(a)), (a+h, f(a+h)), (b, f(b)) 确定二次曲线，积分 = (h/3)(f₀+4f₁+f₂)。复合辛普森：n 为偶数等分，公式 = (h/3)[f₀+f_n + 4Σf_odd + 2Σf_even]。收敛阶 O(h⁴)，比梯形快得多。要求被积函数足够光滑（四阶导连续）。辛普森 3/8 规则用于 n 为奇数的情况。',
        level: 'important',
      },
      {
        name: '高斯求积公式',
        latex: '\\int_{-1}^{1} f(x)dx \\approx \\sum_{i=1}^{n} w_i f(x_i)',
        note: '节点和权重都优化选取，n 点可达 2n-1 次代数精度！常用区间 [-1,1]（高斯-勒让德）。',
        detail: '高斯求积的核心思想：节点不是等距选取，而是选为对应正交多项式的零点，使代数精度最大化。n 点高斯公式 = 精确积分 ≤2n-1 次多项式（等距节点只有 n-1 或 n 次精度）。常用：①高斯-勒让德（区间 [-1,1]，权重函数 w=1）；②高斯-拉盖尔（区间 [0,∞)，w=e^{-x}）；③高斯-埃尔米特（区间 (-∞,∞)，w=e^{-x²}）。一般区间 [a,b] 需先做变量变换到 [-1,1]。',
        level: 'advanced',
      },
    ],
  },

  'num-equation': {
    id: 'num-equation',
    title: '非线性方程求根',
    subject: '数值分析',
    formulas: [
      {
        name: '二分法',
        latex: '\\begin{aligned} &f \\in C[a,b],\\ f(a)\\cdot f(b) < 0 \\\\ &\\text{迭代：取 } c = \\frac{a+b}{2} \\\\ &\\text{若 } f(c)=0 \\text{ 则停止；否则取含根半区间继续} \\end{aligned}',
        note: '最简单可靠的方法！线性收敛，每步误差减半。精度要求 ε 需 log₂((b-a)/ε) 步。',
        detail: '二分法基于零点定理：连续函数在端点异号的区间内必有根。每步将区间对半，保留异号的一半。优点：①绝对可靠（只要初始区间异号则必收敛）；②实现简单。缺点：①收敛速度慢（线性收敛，每步误差减半→约 3-4 步多 1 位精度）；②只能求单根，不能求复根。常与其他方法（牛顿法）配合：先用二分法逼近到附近，再用牛顿法加速。',
        level: 'basic',
      },
      {
        name: '牛顿迭代法（切线法）',
        latex: 'x_{n+1} = x_n - \\frac{f(x_n)}{f\'(x_n)}',
        note: '平方收敛！每步有效位数翻倍。初值必须足够接近真根（局部收敛）。f\'(根)≠0 时效果好。',
        detail: '牛顿法几何意义：过 (x_n, f(x_n)) 作曲线的切线，切线与 x 轴交点即为 x_{n+1}。收敛速度：平方收敛（每步有效位数翻倍）——若初值足够接近。条件：①f\' 在根附近 ≠ 0；②f\'\' 连续；③初值充分接近。缺点：①需要计算导数 f\'；②对初值敏感（选错可能发散）；③f\'≈0 附近效果差。改进：割线法（用差分替代导数，收敛阶 ≈1.618）。',
        level: 'important',
      },
    ],
  },
};

export default formulaData;

export const SECTION_ORDER = Object.keys(formulaData);

export function getSectionTitle(sectionId: string): string {
  return formulaData[sectionId]?.title ?? '';
}
