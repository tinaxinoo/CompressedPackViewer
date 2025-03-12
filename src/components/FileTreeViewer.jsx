import React, { useState } from 'react';
import { message } from 'antd';
import { FileZipOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { Archive } from 'libarchive.js/dist/libarchive.js';
import icons from '@exuanbo/file-icons-js';
import FileTreeHeader from './FileTreeHeader';
import FileTreeContent from './FileTreeContent';


// 初始化 libarchive.js
Archive.init();

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function convertToJsTreeData(obj, path = '') {
  return Object.entries(obj)
    .sort(([keyA, valueA], [keyB, valueB]) => {
      // 如果一个是文件夹，另一个是文件，文件夹排在前面
      if (!(valueA instanceof File) && valueB instanceof File) {
        return -1; // 文件夹排在前面
      }
      if (valueA instanceof File && !(valueB instanceof File)) {
        return 1; // 文件排在后面
      }
      // 如果同为文件夹或文件，按名称的字符串顺序排序
      return keyA.localeCompare(keyB);
    })
    .map(async ([key, value]) => {
      const currentPath = path ? `${path}/${key}` : key;
      if (value instanceof File) {
        const iconClass = await icons.getClass(key); // 获取文件图标类名
        // console.log('iconClass:', key, iconClass);

        // 如果 iconClass 包含 "text"，则替换为 "icon default-icon"
        const finalIconClass = iconClass.includes('text') || iconClass.includes('icon-file-pdf')
          ? 'icon default-icon'
          : iconClass;


        return {
          key: currentPath,
          title: (
            <span>
              {key} <span style={{ color: '#888', fontSize: '0.9em' }}>({formatFileSize(value.size)})</span>
            </span>
          ),
          isLeaf: true, // 标记为叶子节点（文件）
          icon: <i class={finalIconClass} style={{ marginRight: 5 }} />, // 动态设置文件图标
        };
      } else {
        return {
          key: currentPath,
          title: (
            <span>
              <strong>{key}</strong> {/* 将文件夹名称设置为粗体 */}
            </span>
          ),
          isLeaf: false, // 标记为非叶子节点（文件夹）
          icon: <FolderOpenOutlined />, // 文件夹图标
          children: await Promise.all(convertToJsTreeData(value, currentPath)), // 递归处理子节点
        };
      }
    });
}

const FileTreeViewer = () => {
  const [treeData, setTreeData] = useState([]);
  const [contextMenu, setContextMenu] = useState(null); // 新增状态，用于右键菜单
  const [fileList, setFileList] = useState(null); // 存储解压后的文件
  const [expandedKeys, setExpandedKeys] = useState([]); // 存储展开的节点

  // 递归获取文件夹 key 和层级
  const getFolderKeys = (data, level = 0) => {
    let keys = [];
    data.forEach((node) => {
      if (!node.isLeaf) {
        // 将前2层的文件夹 key 加入到 expandedKeys 中
        if (level < 2) {
          keys.push(node.key);
        }
        // 递归获取子文件夹的 key
        keys = [...keys, ...getFolderKeys(node.children || [], level + 1)];
      }
    });
    return keys;
  };
  // 处理文件上传
  const handleFileUpload = async (file) => {
    try {
      const archive = await Archive.open(file);
      const extractedFiles = await archive.extractFiles();
      // console.log('Extracted Files:', extractedFiles);

      setFileList(extractedFiles); // 存储解压后的文件

      const formattedTreeData = await Promise.all(convertToJsTreeData(extractedFiles));

      // 在顶部插入包含文件名的节点
      const rootNode = {
        key: file.name,
        title: (
          <span>
            <FileZipOutlined style={{ marginRight: 5, color: '#1677ff' }} />
            {file.name}
          </span>
        ),
        isLeaf: false,
        children: formattedTreeData,
      };

      setTreeData([rootNode]); // 设定带压缩包文件名的目录树

      // 获取前2层文件夹的 key（包括根节点）
      const initialExpandedKeys = [file.name, ...getFolderKeys(formattedTreeData)];
      setExpandedKeys(initialExpandedKeys);
    } catch (error) {
      // console.error('Error parsing file:', error);
      message.error('文件解析失败，请确保上传的是有效的文件');
    }
  };


  // 递归获取文件对象
  const getFileByKey = (key, obj) => {
    const parts = key.split('/');
    let current = obj;
    for (const part of parts) {
      if (current && current[part]) {
        current = current[part]; // 进入下一层
      } else {
        return null; // 没找到
      }
    }
    return current instanceof File ? current : null;
  };

  const handleSelect = (selectedKeys, { node }) => {
    if (!node.isLeaf) {
      // 切换展开状态
      setExpandedKeys((prevKeys) =>
        prevKeys.includes(node.key)
          ? prevKeys.filter((key) => key !== node.key) // 关闭
          : [...prevKeys, node.key] // 展开
      );
    }
  };
  // 处理下载
  const handleDownload = () => {
    if (!contextMenu || !fileList) return;

    const fileKey = contextMenu.key; // 右键选中的文件路径
    const file = getFileByKey(fileKey, fileList); // 获取对应的文件对象

    if (file) {
      const blobUrl = URL.createObjectURL(file);

      // 生成时间戳（格式：YYYYMMDD_HHmmss）
      const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 15);
      const fileName = `${timestamp}_${fileKey.split('/').pop()}`; // 添加时间戳

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName; // 设置带时间戳的文件名
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(blobUrl); // 释放 URL
      document.body.removeChild(a);
    } else {
      message.error('无法下载文件');
    }

    closeContextMenu(); // 关闭右键菜单
  };


  // 右键点击事件处理函数
  const handleRightClick = ({ event, node }) => {
    if (node.isLeaf) {
      // console.log('右键节点的key:', node.key);

      setContextMenu({
        visible: true,
        x: event.pageX, // 修正 X 轴位置
        y: event.pageY, // 修正 Y 轴位置
        key: node.key,
      });
    }
  };


  // 关闭右键菜单
  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // 添加全局点击事件监听器
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu && !event.target.closest('.ant-menu')) {
        closeContextMenu();
      }
    };

    // 新增：处理鼠标滚轮事件
    const handleWheel = () => {
      if (contextMenu) {
        closeContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('wheel', handleWheel); // 监听滚轮事件

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('wheel', handleWheel); // 移除滚轮事件监听
    };
  }, [contextMenu]);

  return (
    <div style={{ padding: 20 }}>
      <FileTreeHeader onFileUpload={handleFileUpload} />
      <div className='compressed-file-tree-container'>
        <FileTreeContent
          treeData={treeData}
          expandedKeys={expandedKeys}
          setExpandedKeys={setExpandedKeys}
          handleRightClick={handleRightClick}
          handleSelect={handleSelect}
          contextMenu={contextMenu}
          handleDownload={handleDownload}
          closeContextMenu={closeContextMenu}
        />
      </div>
    </div>
  );
};

export default FileTreeViewer;

