import React from 'react';
import { Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

const FileTreeHeader = ({ onFileUpload }) => {
  return (
    <div>
      <h1>压缩包浏览器</h1>
      <Upload.Dragger
        accept=".tar,.tar.gz,.tgz,.zip,.7z,.lzh,.rar"
        showUploadList={false}
        customRequest={({ file }) => onFileUpload(file)}
        style={{ marginBottom: 20 }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到这里</p>
        <p className="ant-upload-hint">支持类型: [.tar],[.tar.gz],[.tgz],[.zip],[.7z],[.lzh],[.rar]</p>
      </Upload.Dragger>
    </div>
  );
};

export default FileTreeHeader;