# 使用 electronuserland/builder 镜像，支持 Windows 打包
FROM electronuserland/builder:wine

# 设置工作目录
WORKDIR /app

# 复制项目文件到容器中
# COPY . .
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 默认命令：运行 Windows 打包
CMD ["npm", "run", "build:win"]