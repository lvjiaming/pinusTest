@echo off

::参数变量


set ti=一个自动化脚本

::设置标题
title %ti%

:List
echo 1 关闭服务器
echo 2 打开服务端路径
echo 3 启动服务器

choice /c 12345 /N /m "选择输入:"
set op=0
if %errorlevel%==1 set /a op=%op%+1
if %errorlevel%==2 set /a op=%op%+2
if %errorlevel%==3 set /a op=%op%+4
goto All

exit

:All

::关闭服务器
set /a res=%op%"&"1
if %res% GTR 0 call close.bat

::服务端代码
set /a res=%op%"&"2
if %res% GTR 0 (
	call open.bat
)

::按配置启动
set /a res=%op%"&"4
if %res% GTR 0 (
	START run.bat
)








goto List
