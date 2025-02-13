#!/usr/bin/env node

import fs from 'fs-extra';
import { program } from 'commander';
import inquirer from 'inquirer';
import { resolve, join } from 'path';
import { MultiBar, Presets } from 'cli-progress';

// 当前项目根目录即为模板目录
const TEMPLATE_DIR = process.cwd(); // 模板就是当前目录
const TARGET_DIR = resolve(process.cwd(), '..'); // 目标目录是当前工作目录
// 需要排除的文件和目录
const EXCLUDE_FILES = [
  'cli.mjs',
  'node_modules',
  'package.json',
  'package-lock.json',
  '.env',
];
program
  .command('init')
  .description('初始化一个新的 Nest 项目')
  .action(async () => {
    console.log('开始初始化新的 Nest 项目...');

    // 提示用户输入项目名称
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: '请输入项目名称',
        validate(input) {
          if (!input) {
            return '项目名称不能为空';
          }
          return true;
        },
      },
    ]);

    const { projectName } = answers;
    const projectPath = join(TARGET_DIR, projectName);

    // 检查项目文件夹是否已存在
    if (fs.existsSync(projectPath)) {
      console.log('该项目已存在，请选择其他名称！');
      return;
    }

    try {
      // 设置进度条
      const bar = new MultiBar(
        {
          clearOnComplete: false,
          hideCursor: true,
        },
        Presets.shades_classic,
      );
      // 获取模板目录下所有文件和目录
      const files = await fs.readdir(TEMPLATE_DIR);
      const totalFiles = files.filter(
        (file) => !EXCLUDE_FILES.includes(file),
      ).length;
      let copiedFiles = 0;

      // 在进度条中添加条目
      const progressBar = bar.create(totalFiles, 0);

      // 复制文件并显示进度
      for (const file of files) {
        const source = join(TEMPLATE_DIR, file);
        const destination = join(projectPath, file);

        await fs.copy(source, destination);
        copiedFiles += 1;
        progressBar.update(copiedFiles);
      }

      // 完成进度条
      bar.stop();
      console.log(`项目 ${projectName} 初始化完成！`);
    } catch (error) {
      console.error('创建项目失败：', error);
    }
  });

// 解析命令行参数
program.parse(process.argv);
