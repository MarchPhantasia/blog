---
title: 给 Flow Launcher 写两个透明主题
description: 从 sublime.xaml 改起，做两个带 acrylic 模糊感的暗色主题——记几个 WPF 上的小坑。
pubDate: 2026-05-01
tags:
  - Flow Launcher
  - WPF
  - Windows
  - 主题
---

Flow Launcher 的现成主题不少，但要找一个「够暗、够透、又不会因为太透而看不清字」的版本，没那么容易。Mica/Acrylic 出来之后，预设主题里的 blur 大多偏亮，配在我深色壁纸上像贴了一张磨砂塑料膜。索性照着官方文档自己写两个。

最后产出是两个文件：`Bullet_Acrylic.xaml` 和 `OnsetGlaze.xaml`，都是 IsDark + HasBlur，思路相近、识别度不同。

## 主题就是一份 WPF ResourceDictionary

Flow Launcher 用的是 WPF，没有 CSS 那一套样式继承——所有「主题」本质上是一份 ResourceDictionary：

```xml
<ResourceDictionary xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    xmlns:system="clr-namespace:System;assembly=mscorlib">
    <ResourceDictionary.MergedDictionaries>
        <ResourceDictionary Source="pack://application:,,,/Themes/Base.xaml" />
    </ResourceDictionary.MergedDictionaries>
    ...
</ResourceDictionary>
```

第一行 `MergedDictionaries` 把 Base.xaml 拉进来，里面定义了所有 `Base*Style` 基类（`BaseQueryBoxStyle`、`BaseItemTitleStyle` ……）。后面写的每个 `Style` 都用 `BasedOn={StaticResource BaseXxxStyle}` 继承一份，再用 `Setter` 覆盖想改的属性。

这意味着主题文件里**所有键都是覆盖**：不写就用基类的默认值，写了就只改列出的 Setter，其他保持继承。

![Flow Launcher 各部件对应的 Style 名称](https://cdn.jsdelivr.net/gh/Flow-Launcher/docs@main/assets/themelayout.png)

## 起点：复制一份 Sublime.xaml

官方文档建议从 [Sublime.xaml](https://github.com/Flow-Launcher/Flow.Launcher/blob/dev/Flow.Launcher/Themes/Sublime.xaml) 开始改。它是个不透明深色主题，覆盖了大部分常用 Style，不需要的可以删，要透明就把 Background 全改掉。

文件丢进这里：

```text
%APPDATA%\FlowLauncher\Themes\
```

注意是 UserData 下，**不要**放进安装目录的默认 Themes 文件夹——更新时会被清掉。

## 打开 blur 的四件套

要让主题真的模糊，必须加这四个键：

```xml
<system:Boolean x:Key="ThemeBlurEnabled">True</system:Boolean>
<system:String x:Key="SystemBG">Auto</system:String>
<Color x:Key="LightBG">#4A000000</Color>
<Color x:Key="DarkBG">#4A000000</Color>
```

- `ThemeBlurEnabled`：True 才有 blur，False 等于把这个机制关掉
- `SystemBG`：`Auto` 让 Flow 跟着自己的 ColorScheme 切 Light / Dark；也可以写死
- `LightBG` / `DarkBG`：分别是 Light / Dark 模式下盖在系统底色之上的「罩色」

两个主题都用了 `#4A000000`：纯黑，alpha = 0x4A（约 29%）。试过 0x80（50%）以上，背景太黑没有「透」的感觉；0x20（12%）以下又太透，文字开始浮。0x40 到 0x55 之间是甜蜜区——具体看壁纸。

> 重要的不是 alpha 多少，而是这层色是叠在系统画好的底之上的——颜色应该接近系统会画的那种灰/黑，不要选远离它的色。

## 别忘了窗口边框也要透明

第一次写完跑起来，整个窗口还是一块不透明的深色。原因是 `WindowBorderStyle` 自己也有 `Background`，会盖住下面的 blur 层。

```xml
<Style x:Key="WindowBorderStyle" BasedOn="{StaticResource BaseWindowBorderStyle}" TargetType="{x:Type Border}">
    <Setter Property="BorderThickness" Value="1" />
    <Setter Property="BorderBrush" Value="#444444" />
    <Setter Property="Background" Value="Transparent" />
    <Setter Property="CornerRadius" Value="8" />
    <Setter Property="UseLayoutRounding" Value="True" />
</Style>
```

`Background = Transparent` 是关键。`CornerRadius` 两个主题都用 8，跟 Win11 自带主题对齐。

不过文档里有一句容易漏掉的提醒：**blur 启用后，窗口阴影和圆角会被系统接管**，写在主题里的 `CornerRadius` 和阴影对 Win11 不一定生效。这件事没法跟系统较劲，认了。

## 第一个：Bullet_Acrylic

第一个主题的设计意图是给「当前选中项」做一个明显的左侧视觉锚点——一根 4px 宽、50px 高的小竖条，未选中时半透明黑，选中时玫红：

```xml
<Style x:Key="BulletStyle" BasedOn="{StaticResource BaseBulletStyle}" TargetType="{x:Type Border}">
    <Setter Property="Width" Value="4" />
    <Setter Property="Height" Value="50" />
    <Setter Property="Background" Value="#55000000" />
</Style>
<Style x:Key="ItemBulletSelectedStyle" BasedOn="{StaticResource BaseBulletStyle}" TargetType="{x:Type Border}">
    <Setter Property="Width" Value="4" />
    <Setter Property="Height" Value="50" />
    <Setter Property="Background" Value="#e51050" />
</Style>
```

`#e51050` 是接近 crimson 的玫红，在深色背景上够亮但不刺眼。配合一个同色低透明的选中底色：

```xml
<SolidColorBrush x:Key="ItemSelectedBackgroundColor">#44e51050</SolidColorBrush>
```

`#44e51050` = 玫红 + alpha 0x44。这样选中那一行 = 玫红 bullet + 玫红淡背景，整条选中带在视觉上是连起来的。`CaretBrush` 也设成同色，输入光标和选中色调统一。

QueryBox 字号用了 25——比文档默认 24 大一点点，因为透明背景下小字更容易糊。

## 第二个：OnsetGlaze

第二个主题反过来：没有 bullet，更冷淡。色相也换成偏蓝紫：

```xml
<SolidColorBrush x:Key="ItemSelectedBackgroundColor">#19c9c9fb</SolidColorBrush>
```

`#c9c9fb` 是淡薰衣草色，alpha 0x19（10%）——比 Bullet_Acrylic 的选中色更弱，整体观感像玻璃上结了一层薄霜。Glaze（釉、薄冰）这个名字就是这么来的。

QueryBox 字号也降到 18，比 Bullet_Acrylic 小不少。两个字号差这么多，是因为它们解决的不是同一个问题：Bullet_Acrylic 要「显眼好认」，OnsetGlaze 要「安静不抢眼」。

## 头部那段注释不能省

XAML 文件最顶上要写一段 HTML 注释：

```xml
<!--
    Name: Bullet Acrylic
    IsDark: True
    HasBlur: True
-->
```

Flow Launcher 读这三个字段，决定主题在设置面板里的显示——名字、是否标记为暗色、是否标记为 blur 主题。漏了的话主题还能用，但列表里不带这些标记，看着很简陋。

## Win11 的 blur 模式会改变你的 LightBG/DarkBG 语义

Win11 下用户能选四种 blur：None / Acrylic / Mica / Mica Alt。每种对 `LightBG` / `DarkBG` 的处理方式不同：

- **None**：用 LightBG/DarkBG 去掉 alpha 后的颜色当背景；没设这两个键就退到 `WindowBorderStyle` 的 Background
- **Acrylic**：系统先画一层模糊背景，再把 LightBG/DarkBG 当 tint 叠上去——alpha 必须留，颜色不要离系统底色太远
- **Mica / Mica Alt**：**完全忽略你的 LightBG/DarkBG**，背景跟用户壁纸走，只能通过 `SystemBG` 选 Light 还是 Dark

也就是说，主题在 Mica 模式下基本上「只剩文字部分」。设计 blur 主题最稳妥的做法，是把前景元素的颜色都基于黑/白调透明度——不管系统怎么画底色，黑白叠上去都不会翻车。

## 装好之后

XAML 文件丢进 `%APPDATA%\FlowLauncher\Themes\`，重新打开 Setting → Theme 就能看到。如果做得满意，可以发到官方的 [Theme Gallery](https://github.com/Flow-Launcher/Flow.Launcher/discussions/1438)，里面已经有几十个社区主题。

折腾完两个的感受是：WPF 这套 ResourceDictionary + Style 继承其实挺老派地直白，比前端的层叠规则要透明得多——只要知道每个 Style 的 Key，就知道它会作用在哪个部件上。文档里那张元素图比文字描述好用很多，建议一边对着图改，一边反复重启 Flow 看效果。

---

_灵感来自 [How to Create a Theme](https://www.flowlauncher.com/docs/#/how-to-create-a-theme)（Flow Launcher 官方文档）。_
