import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'
import vueDevTools from 'vite-plugin-vue-devtools'
import viteCompression from 'vite-plugin-compression'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import ElementPlus from 'unplugin-element-plus/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import tailwindcss from '@tailwindcss/vite'
// import { visualizer } from 'rollup-plugin-visualizer'

// ESM 模式下没有 __dirname，需基于 import.meta.url 推导
const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default ({ mode }: { mode: string }) => {
  const root = process.cwd()
  const env = loadEnv(mode, root)

  // 基础配置（必需）
  const {
    VITE_VERSION,
    VITE_PORT,
    VITE_BASE_URL,
    VITE_API_URL,
    VITE_API_PROXY_URL
  } = env

  // 扩展配置（可选，提供默认值，避免缺失时导致 undefined 行为）
  const {
    VITE_WITH_CREDENTIALS = 'false',
    VITE_ACCESS_MODE = 'frontend',
    VITE_USE_MOCK = 'false',
    VITE_USE_GZIP = 'true',
    VITE_USE_CDN = 'false',
    VITE_LOCK_ENCRYPT_KEY = 'art-design-pro-lock-key',
    VITE_OPEN_ROUTE_INFO = 'false'
  } = env

  const isProd = mode === 'production'
  const useGzip = VITE_USE_GZIP === 'true'
  const useMock = VITE_USE_MOCK === 'true'
  const useCdn = VITE_USE_CDN === 'true'

  console.log(`🚀 API_URL     = ${VITE_API_URL}`)
  console.log(`🚀 PROXY_URL   = ${VITE_API_PROXY_URL}`)
  console.log(`🚀 VERSION     = ${VITE_VERSION}`)
  console.log(`🚀 MODE        = ${VITE_ACCESS_MODE}`)
  console.log(`🚀 USE_MOCK    = ${useMock}`)
  console.log(`🚀 USE_GZIP    = ${useGzip}`)
  console.log(`🚀 USE_CDN     = ${useCdn}`)

  return defineConfig({
    define: {
      __APP_VERSION__: JSON.stringify(VITE_VERSION)
    },
    base: VITE_BASE_URL,
    server: {
      port: Number(VITE_PORT),
      open: true,
      host: true,
      cors: true,
      proxy: {
        '/api': {
          target: VITE_API_PROXY_URL,
          changeOrigin: true
          // 不重写路径：后端真实路由已是 /api/...（如 /api/auth/login）
        }
      }
    },
    // 路径别名
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@views': resolvePath('src/views'),
        '@imgs': resolvePath('src/assets/images'),
        '@icons': resolvePath('src/assets/icons'),
        '@utils': resolvePath('src/utils'),
        '@stores': resolvePath('src/store'),
        '@styles': resolvePath('src/assets/styles')
      }
    },
    build: {
      target: 'es2015',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProd,
      chunkSizeWarningLimit: 2000,
      cssCodeSplit: true,
      reportCompressedSize: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          // 生产环境去除 console
          drop_console: true,
          // 生产环境去除 debugger
          drop_debugger: true,
          // 去除纯函数调用与未使用变量
          pure_funcs: ['console.log', 'console.info', 'console.debug']
        }
      },
      // 拆包策略：把不易变化的大型依赖单独打包，提升缓存命中率
      rollupOptions: {
        output: {
          // 入口 chunk 的文件名
          entryFileNames: 'assets/js/[name]-[hash].js',
          // 分包（按需加载）的 chunk 文件名
          chunkFileNames: 'assets/js/[name]-[hash].js',
          // 静态资源文件名
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
          // 手动分包
          manualChunks: {
            'vendor-vue': ['vue', 'vue-router', 'pinia'],
            'vendor-element': ['element-plus', '@element-plus/icons-vue'],
            'vendor-echarts': ['echarts/core', 'echarts/charts', 'echarts/components', 'echarts/renderers'],
            'vendor-utils': ['axios', 'crypto-js', 'xlsx', 'file-saver']
          }
        }
      },
      dynamicImportVarsOptions: {
        warnOnError: true,
        exclude: [],
        include: ['src/views/**/*.vue']
      }
    },
    plugins: [
      vue(),
      tailwindcss(),
      // 自动按需导入 API
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
        dts: 'src/types/import/auto-imports.d.ts',
        resolvers: [ElementPlusResolver()],
        eslintrc: {
          enabled: true,
          filepath: './.auto-import.json',
          globalsPropValue: true
        }
      }),
      // 自动按需导入组件
      Components({
        dts: 'src/types/import/components.d.ts',
        resolvers: [ElementPlusResolver()]
      }),
      // 按需定制主题配置
      ElementPlus({
        useSource: true
      }),
      // 生产环境 Gzip 压缩
      ...(useGzip
        ? [
            viteCompression({
              verbose: false,
              disable: false,
              algorithm: 'gzip',
              ext: '.gz',
              threshold: 10240,
              deleteOriginFile: false
            })
          ]
        : []),
      // 仅在开发环境启用 vue-devtools，避免污染生产包
      ...(!isProd ? [vueDevTools()] : [])
      // 打包分析
      // visualizer({
      //   open: true,
      //   gzipSize: true,
      //   brotliSize: true,
      //   filename: 'dist/stats.html'
      // }),
    ],
    // 依赖预构建：避免运行时重复请求与转换，提升首次加载速度
    optimizeDeps: {
      include: [
        'echarts/core',
        'echarts/charts',
        'echarts/components',
        'echarts/renderers',
        'xlsx',
        'xgplayer',
        'crypto-js',
        'file-saver',
        'vue-img-cutter',
        'element-plus/es',
        'element-plus/es/components/*/style/css',
        'element-plus/es/components/*/style/index'
      ]
    },
    css: {
      preprocessorOptions: {
        // sass variable and mixin
        scss: {
          additionalData: `
            @use "@styles/core/el-light.scss" as *;
            @use "@styles/core/mixin.scss" as *;
          `,
          api: 'modern-compiler'
        }
      },
      postcss: {
        plugins: [
          {
            postcssPlugin: 'internal:charset-removal',
            AtRule: {
              charset: (atRule) => {
                if (atRule.name === 'charset') {
                  atRule.remove()
                }
              }
            }
          }
        ]
      }
    }
  })
}

function resolvePath(paths: string) {
  return path.resolve(__dirname, paths)
}
