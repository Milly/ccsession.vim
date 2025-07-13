# ccsession.vim

[![license:MIT](https://img.shields.io/github/license/Milly/ccsession.vim?style=flat-square)](LICENSE)
[![Vim doc](https://img.shields.io/badge/doc-%3Ah%20ccsession%2Evim-orange?style=flat-square&logo=vim)][doc]

_ccsession.vim_ is a [ddu.vim] source and kind plugin that collects session data
from [Claude Code] and resumes them in `:terminal`.

[Claude Code]: https://github.com/anthropics/claude-code

## Installation

### Required

- [denops.vim]
- [ddu.vim]

[denops.vim]: https://github.com/vim-denops/denops.vim
[ddu.vim]: https://github.com/Shougo/udu.vim

## Configuration

See [`:help ccsession`][doc] for details.

[doc]: doc/ccsession.txt

```vim
call ddu#custom#patch_global('sources', ['ccsession'])

" Optional: Set source parameters, see `:help ccsession-source-params`.
call ddu#custom#patch_global('sourceParams', #{
      \  ccsession: #{
      \    all: v:false,
      \    projectPaths: [],
      \  }
      \})

" Optional: Set kind parameters, see `:help ccsession-kind-params`.
call ddu#custom#patch_global('kindParams', #{
      \  ccsession: #{
      \    allowMultipleResume: v:false,
      \    terminalOpenModifier: 'horizontal',
      \  }
      \})
```
