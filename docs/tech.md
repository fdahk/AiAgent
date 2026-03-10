# Flutter 初始技术说明

## 初始化

只做移动端时，建议先只开 `iOS` 和 `Android`。当前仓库已经实际创建为 `app/` 目录，下面的命令按当前仓库状态记录：

```bash
flutter create --org com.aiagent --platforms=ios,android app

cd app
flutter pub add flutter_riverpod:^2.6.1 go_router:^17.1.0 dio:^5.9.2 freezed_annotation:^3.1.0 json_annotation:^4.9.0 intl:^0.20.2 flutter_secure_storage:^10.0.0
# flutter_localizations 不是 pub.dev 上的普通第三方包，而是 Flutter SDK 自带的官方包，如果你想用命令添加，应该写：
# 会被当成“去 pub.dev 下载一个叫 flutter_localizations 的包”，于是找不到。
# 正确做法是把它作为 SDK dependency 添加。
flutter pub add flutter_localizations --sdk=flutter
flutter pub add --dev build_runner:^2.4.15 freezed:^3.2.3 json_serializable:^6.9.5 flutter_lints:^5.0.0
```

补充：
推送通知：如 firebase_messaging
图表：如 fl_chart
本地普通缓存：如 shared_preferences
环境配置：如 flutter_dotenv
日志与网络调试：如 logger
测试辅助：如 mocktail

## 依赖冲突记录

### 问题描述

在执行下面这条命令时出现依赖求解失败：

```bash
flutter pub add --dev build_runner freezed json_serializable flutter_lints
```

终端报错的核心现象是：

- `flutter_test from sdk` 与部分最新依赖链不兼容
- `json_serializable` 的最新版本会拉高 `analyzer` 和 `source_gen` 要求
- 当前安装到的 `flutter_riverpod ^3.3.1` 也会带来一组较新的依赖链
- 最终 `pub` 找不到一组所有包都同时接受的版本组合

### 问题原因

#### 表层原因

最开始使用的是“无版本号直接安装”的方式：

```bash
flutter pub add flutter_riverpod go_router dio freezed_annotation json_annotation intl flutter_localizations flutter_secure_storage
flutter pub add --dev build_runner freezed json_serializable flutter_lints
```

这会触发 `pub` 默认尽量选择当前最新版本。

而 Flutter 工程中，“最新版本”不一定等于“当前 Flutter SDK 下最兼容的版本组合”。

#### 深层原因

这次问题本质上是一个“依赖图无解”问题。

可以把每个依赖包理解成都会声明：

- 我依赖哪些下游包
- 我能接受哪些版本范围

例如：

- `flutter_test` 由 Flutter SDK 自带，会固定一部分测试生态版本
- `json_serializable` 会依赖 `source_gen`、`analyzer`
- `freezed` 也会依赖 `source_gen`
- `flutter_riverpod` 的新版本会带来更新的依赖树

如果多个包对同一个下游包提出的版本要求彼此不重叠，那么依赖求解器就会失败。

#### 这次冲突里关键的几个点

1. `flutter_test` 来自 Flutter SDK，不是普通三方包，它会锁定部分测试生态版本。
2. `json_serializable` 较新的版本会要求更高版本的 `analyzer`。
3. `freezed`、`json_serializable`、`source_gen` 之间存在联动兼容关系。
4. `flutter_riverpod 3.x` 会把依赖树整体推向更新的组合。
5. 这些约束叠在一起后，求解器无法找到公共交集。

### 解决方案

采用方案 A，也就是：

**放弃“全量最新版本优先”，改为“保守稳定、兼容优先”的版本策略。**

本次验证通过的版本组合如下：

```yaml
dependencies:
  flutter_riverpod: ^2.6.1
  go_router: ^17.1.0
  dio: ^5.9.2
  freezed_annotation: ^3.1.0
  json_annotation: ^4.9.0
  intl: ^0.20.2
  flutter_secure_storage: ^10.0.0
  flutter_localizations:
    sdk: flutter

dev_dependencies:
  flutter_lints: ^5.0.0
  build_runner: ^2.4.15
  freezed: ^3.2.3
  json_serializable: ^6.9.5
```

### 解决问题的每一步

#### 第一步：识别真正失败的不是命令，而是版本求解

表面上看是 `flutter pub add --dev` 失败了，但本质不是命令格式错误，而是依赖求解器发现当前版本组合无解。

为什么要先确认这一点：

- 如果误以为是 Flutter 命令写错了，就会一直重复执行命令
- 但实际上需要处理的是“版本范围冲突”

#### 第二步：识别 `flutter_localizations` 的来源

最早还遇到了：

```bash
flutter pub add flutter_localizations
```

失败的问题。  
这是因为 `flutter_localizations` 不是 pub.dev 上的普通包，而是 Flutter SDK 自带包，所以必须写成：

```bash
flutter pub add flutter_localizations --sdk=flutter
```

这一步的重要性在于先把“SDK 包”和“pub.dev 三方包”区分清楚，否则后面的依赖分析会被干扰。

#### 第三步：把高风险依赖从“最新版本”改成“稳定版本”

这一步主要处理容易引发联动冲突的几个包：

- `flutter_riverpod`
- `json_annotation`
- `build_runner`
- `freezed`
- `json_serializable`

其中最关键的动作是：

- 将 `flutter_riverpod` 从 `3.3.1` 收敛到 `2.6.1`
- 将 `json_annotation` 收敛到 `4.9.0`
- 将 `json_serializable` 固定为 `6.9.5`

为什么这样做有效：

- `Riverpod 2.x` 的依赖树更保守
- `json_serializable 6.9.5` 避开了更新 `analyzer` 链路带来的冲突
- `freezed 3.2.3`、`json_serializable 6.9.5`、`build_runner 2.4.15` 这组在当前工程里已经实际验证通过

#### 第四步：重新执行依赖安装

实际执行并验证通过的命令是：

```bash
flutter pub add flutter_riverpod:^2.6.1 json_annotation:^4.9.0
flutter pub add --dev build_runner:^2.4.15 freezed:^3.2.3 json_serializable:^6.9.5
```

执行后依赖求解成功，说明新的版本约束已经形成可解的公共交集。

#### 第五步：运行测试和静态分析

修复依赖后执行：

```bash
flutter test
flutter analyze
```

结果：

- `flutter test` 通过
- `flutter analyze` 无问题

这一步的意义不是“走流程”，而是确认：

- 新的依赖组合不会破坏默认测试环境
- 分析器版本链路已经稳定
- 当前脚手架处于可继续开发状态

### 方案有效的底层原理

#### 1. `pub` 依赖求解的本质

`pub` 会读取每个包的版本约束，然后尝试找出一组同时满足所有约束的版本集合。  
这是一个典型的约束求解问题。

只要有一个关键依赖没有公共版本交集，整个求解就会失败。

#### 2. 为什么保守版本更容易成功

越新的版本，通常意味着：

- 依赖更高版本的 `analyzer`
- 依赖更高版本的 `source_gen`
- 依赖树中更多上游包一起升级

而 Flutter SDK 自带的 `flutter_test` 又不是完全自由浮动的，它会固定一部分包。  
所以在脚手架阶段，选择相对稳定、已经大量使用的版本，更容易落在兼容区间内。

#### 3. 为什么这不是“降级就是落后”

这里做的不是盲目降级，而是：

**先找到一组与当前 Flutter SDK、测试生态、代码生成生态相互兼容的工作组合。**

脚手架阶段最重要的是：

- 能安装成功
- 能通过测试
- 能通过分析
- 后面能稳定迭代

这比单纯追最新版本更重要。

### 需要注意的点

- Flutter 项目初始化时，不建议对所有依赖都使用无版本号安装。
- `flutter_localizations` 属于 Flutter SDK 依赖，不能按普通 pub 包处理。
- `freezed`、`json_serializable`、`build_runner`、`source_gen`、`analyzer` 是联动最强的一组依赖。
- 如果以后升级 `flutter_riverpod 3.x`，要重新检查代码生成链和测试生态是否仍兼容。
- 每次大版本升级后，最好立即跑一次 `flutter test` 和 `flutter analyze`。

### 当前结论

对于当前项目和当前 Flutter SDK 而言，采用“兼容优先”的保守稳定方案是有效的。  
它已经在本仓库中完成实际验证：

- 依赖安装成功
- `flutter test` 通过
- `flutter analyze` 通过

## `freezed + json_serializable`

### 它们分别是什么

- `freezed`：一个基于代码生成的 Dart 数据类工具，用来更轻松地定义不可变对象、拷贝对象、值相等比较，以及联合类型。
- `json_serializable`：一个基于代码生成的 JSON 序列化工具，用来自动生成 `fromJson` / `toJson` 代码。
- `build_runner`：代码生成的执行器，负责扫描注解并生成对应的 `.g.dart`、`.freezed.dart` 文件。


### 先理解几个必要概念

#### 1. 数据模型

数据模型就是对业务数据结构的代码表达，例如 `RunSummary`、`RunDetail`、`AlertItem`。

#### 2. JSON

接口返回的数据通常是 JSON，本质上是一种文本格式的数据交换协议。  
App 从服务端拿到的其实是字符串或字节流，最终会被解析成 Dart 的 `Map<String, dynamic>`。

#### 3. 序列化 / 反序列化

- 序列化：把 Dart 对象转成 JSON
- 反序列化：把 JSON 转成 Dart 对象

#### 4. 不可变对象

不可变对象是指对象创建后字段不再被直接修改。如果要改值，通常通过 `copyWith()` 生成一个新对象。  
这对状态管理很重要，因为状态变化会更清晰、更可预测。

#### 5. 代码生成

代码生成不是运行时“动态造代码”，而是在开发阶段通过工具读取注解，再把辅助代码提前生成到文件里。  
生成后的代码会被编译进应用，因此运行时不需要反射。

### 本质上是在做什么

本质上是在做两件事：

1. 用更稳定、更一致的方式定义“接口数据长什么样”
2. 把重复且容易出错的样板代码交给生成器处理

如果不用它们，你需要手写：

- 构造函数
- `copyWith`
- `==` 和 `hashCode`
- `toString`
- `fromJson`
- `toJson`

这类代码量大、重复高，而且字段一多就容易漏改。

### 发挥作用的原理是什么

#### `freezed` 的作用原理

你在 Dart 文件里写一个带注解的模型定义，例如：

```dart
@freezed
class RunSummary with _$RunSummary {
  const factory RunSummary({
    required String id,
    required String status,
    required String title,
  }) = _RunSummary;
}
```

`freezed` 会基于这段定义生成：

- 真正的实现类
- `copyWith()`
- 值相等比较
- `toString()`
- 联合类型相关能力

也就是说，你写的是“声明式模型定义”，生成器帮你补齐“机械实现细节”。

#### `json_serializable` 的作用原理

当模型带上 JSON 相关注解后，生成器会读取字段名、类型、注解配置，然后生成：

- `_$RunSummaryFromJson(Map<String, dynamic> json)`
- `_$RunSummaryToJson(RunSummary instance)`

这样接口层收到 JSON 后，可以自动映射成强类型对象。

### 作用过程的底层链路

从开发到运行，大致会经过这条链路：

1. 你编写带注解的 Dart 模型
2. `build_runner` 扫描源码中的注解
3. `freezed` 和 `json_serializable` 生成辅助代码文件
4. Dart 编译器将手写代码和生成代码一起编译
5. 运行时，网络层拿到 JSON
6. `fromJson` 把动态结构转换为强类型模型
7. 页面和状态管理层消费强类型数据

这里的关键点是：  
这些能力主要依赖“编译前代码生成”，不是依赖运行时反射，所以更适合 Flutter 的编译模型，也更利于性能和 tree shaking。

### 为什么在当前项目里有必要

对 `Agent Workspace` 这类双端系统，模型会很多，例如：

- `RunSummary`
- `RunDetail`
- `StepTrace`
- `ApprovalAction`
- `AlertItem`
- `MetricsOverview`

如果没有统一模型工具：

- Web 和 Flutter 的语义容易漂移
- 字段名改动时容易漏改
- 状态流转难以保证稳定
- 列表页、详情页、审批页会不断重复写转换代码

### 扩展知识

#### 联合类型

`freezed` 支持联合类型，适合表示状态机，例如：

- loading
- success
- error

这对 Flutter 页面状态和异步请求状态很有帮助。

#### `copyWith`

`copyWith` 的作用是基于旧对象创建一个局部修改的新对象，这对不可变状态管理非常重要。

#### 值相等

默认对象比较通常比的是引用地址。  
`freezed` 生成的值相等比较会按字段比较内容，这对 Riverpod、状态变更判断、测试断言都很有帮助。

### 需要注意的点

- 不要手改 `.g.dart` 或 `.freezed.dart` 文件，它们会被重新生成覆盖。
- 字段重命名时要同步考虑接口兼容性。
- JSON 字段名和 Dart 字段名不一致时，要用注解显式映射。
- 生成代码后要及时重新执行生成命令，否则会出现类型不匹配或找不到方法的问题。
- 模型层尽量只做数据表达，不要混入复杂 UI 逻辑。

### 常用命令

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

开发时也可以使用监听模式自动生成：

```bash
flutter pub run build_runner watch --delete-conflicting-outputs
```

## `intl + flutter_localizations`

### 它们分别是什么

- `intl`：国际化基础库，负责消息、日期、数字、货币等本地化处理。
- `flutter_localizations`：Flutter 官方提供的本地化支持包，负责把 Flutter 组件库接入不同语言环境。

### 先理解几个必要概念

#### 1. 国际化 `i18n`

国际化是指在代码层面预留多语言、多地区、多格式适配能力。  
它解决的是“系统如何支持不同地区用户”。

#### 2. 本地化 `l10n`

本地化是把某种具体语言和地区资源真正落进去，例如英文文案、中文文案、日期格式、数字格式。

#### 3. Locale

`Locale` 代表地区和语言，例如：

- `en`
- `en_US`
- `zh_CN`

同样是英语，不同地区的日期、货币、习惯格式也可能不同。

### 本质上是在做什么

本质上是在做“把界面中的可变文本和格式规则，从代码逻辑中抽离出来”，交给语言资源系统管理。

如果不这样做，页面里会充满硬编码字符串，例如：

```dart
Text('Run Detail')
```

以后要支持多语言时，几乎所有页面都要重改。

### 发挥作用的原理是什么

#### `intl` 的原理

`intl` 会根据当前 `Locale` 和定义好的消息资源，决定：

- 当前应该显示哪种语言文本
- 日期应该如何格式化
- 数字和货币应该如何格式化

例如同一个时间戳，在不同地区可以显示成不同格式。

#### `flutter_localizations` 的原理

Flutter 自带很多 Material / Cupertino / Widgets 组件，这些组件内部也有文本和地区行为，比如：

- 日期选择器
- 返回按钮文案
- 分页组件
- 对话框

`flutter_localizations` 会把这些系统组件和你的 App 当前语言环境绑定起来，让框架级组件也自动本地化。

### 作用过程的底层链路

大致链路如下：

1. 系统或应用确定当前 `Locale`
2. Flutter 启动 `localizationsDelegates`
3. 对应语言资源被加载进内存
4. 页面通过本地化对象读取对应文案
5. `intl` 按当前地区规则格式化日期、数字、货币
6. Flutter 官方组件同步切换到对应语言环境

换句话说，国际化系统本质上是一个“根据语言环境查找资源和格式规则”的运行机制。

### 为什么在当前项目里有必要

即使你当前规则要求前端文案全部先用英语，也建议从第一天接入国际化基础设施，原因有三个：

1. 这类项目后面很可能要加中文演示或多语言展示
2. 早接入成本低，晚接入改造成本高
3. 文案统一收口后，更利于维护和审查

### 扩展知识

#### 不是只有“翻译文本”

国际化不只是翻译，还包括：

- 日期格式
- 数字格式
- 货币格式
- 时区相关展示
- 复数规则
- 某些语言的语序差异

#### ARB

Flutter 常用 `ARB` 文件存多语言文案资源。  
本质上它是结构化消息资源文件，便于工具生成访问代码。

### 需要注意的点

- 不要在页面里直接硬编码用户可见文案。
- 先统一约定 key 命名规则，例如 `runDetailTitle`、`approvalRejectButton`。
- 你的项目当前要求前端文案全部用英语，因此第一版资源建议先只落英文内容。
- 日期和时间展示要提前想清楚是按设备时区、用户时区还是业务时区。
- 后续如果接服务端文案，也要避免前后端多处重复维护同一份文本。

## `flutter_secure_storage`

### 它是什么

`flutter_secure_storage` 是一个跨平台安全存储插件，用来把敏感信息保存在系统提供的安全存储区域中，例如：

- access token
- refresh token
- user credential snapshot
- 某些加密配置

### 先理解几个必要概念

#### 1. 持久化

持久化是指数据在应用关闭后仍然可以保留，不会随着内存释放而消失。

#### 2. 凭证 `credential`

凭证是用来证明身份或授权的敏感信息，例如 token、session 信息、密钥片段。

#### 3. Keychain / Keystore

- iOS 常用 `Keychain`
- Android 常用 `Keystore` 配合加密存储机制

这类系统能力由操作系统提供，安全等级通常高于普通本地文件或 `SharedPreferences`。

### 本质上是在做什么

本质上是在做“把敏感数据交给操作系统的安全存储设施管理”，而不是直接明文写进普通本地存储。

如果把 token 直接放在普通存储中：

- 容易被调试、导出或误读
- 安全边界较弱
- 不符合很多真实项目的安全要求

### 发挥作用的原理是什么

`flutter_secure_storage` 自身不是密码学底层实现者，它更像一个 Flutter 层封装器。  
它通过平台通道把读写请求转发给原生平台，再调用：

- iOS 的安全存储能力
- Android 的安全存储能力

也就是说，真正提供安全性的核心不是 Dart 代码本身，而是底层操作系统提供的安全设施。

### 作用过程的底层链路

大致过程如下：

1. Flutter 代码调用 `write` / `read`
2. 插件通过平台通道把请求传给原生层
3. 原生层调用系统安全存储 API
4. 数据被加密后保存到安全区域，或从安全区域读取
5. 结果再通过平台通道返回给 Flutter

这里的关键是：  
Flutter 只是统一调用入口，真正的数据保护依赖平台原生安全能力。

### 为什么在当前项目里有必要

你的 Flutter 端后面大概率会有：

- 登录态
- token 刷新
- 审批操作
- 告警跳转后的身份校验

这些都涉及凭证持久化。  
因此从脚手架阶段就应该把“敏感数据走安全存储”定成基础规范。

### 扩展知识

#### 为什么不用 `shared_preferences`

`shared_preferences` 更适合存放普通配置，例如：

- 是否首次启动
- UI 开关状态
- 非敏感缓存

它不适合直接存 token 这类高敏感信息。

#### 令牌生命周期

实际项目里通常不会只存一个 token，而是要考虑：

- access token 过期时间
- refresh token 刷新机制
- 退出登录时的清理
- token 失效后的重登策略

### 需要注意的点

- 安全存储不等于绝对安全，只是比普通本地存储更安全。
- 不要把超大对象长期塞进安全存储，它更适合少量敏感键值。
- 登出时要明确清理 token。
- 读写是异步操作，要考虑启动时的鉴权恢复流程。
- 真机与模拟器的行为可能存在差异，涉及安全能力时最好真机验证。

## 组合起来后的整体意义

这三组能力放在一起，刚好对应 Flutter 项目初期最关键的三层基础设施：

- `freezed + json_serializable`：解决“数据模型如何稳定表达和转换”
- `intl + flutter_localizations`：解决“界面文案和格式如何可维护、可扩展”
- `flutter_secure_storage`：解决“敏感身份信息如何安全持久化”

它们分别覆盖：

- 数据层
- 展示层
- 安全与状态恢复层

对 `Agent Workspace` 这样的项目来说，这不是“可有可无的库选择”，而是在为后续：

- run 数据展示
- 审批交互
- 登录鉴权
- 多语言演示
- 复杂状态管理

提前打地基。