import React from 'react';
import { Tree, Menu, Modal } from 'antd';
import { DownOutlined } from '@ant-design/icons';

const FileTreeContent = ({
  treeData,
  expandedKeys,
  setExpandedKeys,
  handleRightClick,
  handleSelect,
  contextMenu,
  handleDownload,
  closeContextMenu
}) => {
  const [previewVisible, setPreviewVisible] = React.useState(false);
  const [previewContent, setPreviewContent] = React.useState('');
  const [previewTitle, setPreviewTitle] = React.useState('');

  // 处理文件预览
  const handlePreview = async () => {
    if (!contextMenu) return;

    try {
      const file = contextMenu.node;
      if (file && file.isLeaf) {
        const content = await file.text();
        setPreviewContent(content);
        setPreviewTitle(file.key.split('/').pop());
        setPreviewVisible(true);
      }
    } catch (error) {
      console.error('预览文件失败:', error);
    }
    closeContextMenu();
  };

  return (
    <>
      {treeData.length > 0 && (
        <>
          <h3>文件目录结构</h3>
          <Tree
            treeData={treeData}
            switcherIcon={<DownOutlined />}
            showLine
            showIcon
            height={400}
            onRightClick={({ event, node }) => handleRightClick({ event, node })}
            expandedKeys={expandedKeys}
            onExpand={setExpandedKeys}
            onSelect={handleSelect}
            virtual={true}
          />
        </>
      )}

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          style={{
            position: 'absolute',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            border: '1px solid #ccc',
            backgroundColor: '#fff',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            borderRadius: '8px',
          }}
        >
          <Menu
            items={[
              { key: 'download', label: '下载', onClick: handleDownload },
              { key: 'view', label: '查看', onClick: handlePreview },
            ]}
            onClick={closeContextMenu}
            className="ant-menu"
            style={{ borderRadius: '8px' }}
          />
        </div>
      )}

      {/* 文件预览模态框 */}
      <Modal
        title={previewTitle}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
        style={{ top: 20 }}
      >
        <pre style={{
          maxHeight: '70vh',
          overflow: 'auto',
          padding: '12px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          {previewContent}
        </pre>
      </Modal>
    </>
  );
};

export default FileTreeContent;