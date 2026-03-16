{
  description = "hoepel-app development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_18
            yarn
            firebase-tools
            google-cloud-sdk
            (python3.withPackages (ps: with ps; [ pip ]))
          ];

          env.PIP_PREFIX = "$(pwd)/.pip";

          shellHook = ''
            export PIP_PREFIX="$PWD/.pip"
            export PYTHONPATH="$PIP_PREFIX/lib/python3.11/site-packages:$PYTHONPATH"
            export PATH="$PIP_PREFIX/bin:$PATH"
            echo "hoepel-app dev environment loaded"
            echo "Node: $(node --version)"
            echo "Yarn: $(yarn --version)"
            echo "Firebase: $(firebase --version)"
          '';
        };
      });
}
