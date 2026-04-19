using FluentValidation;
using OhmERP.Application.DTOs.Role;

namespace OhmERP.Application.Validators.Role;

public class RoleDtoValidator : AbstractValidator<RoleDto>
{
    public RoleDtoValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Rol Kodu boş bırakılamaz.")
            .MaximumLength(100).WithMessage("Rol Kodu en fazla 100 karakter olabilir.")
            .Matches("^[A-Z0-9_-]+$").WithMessage("Sistem kodlarında Türkçe karakter (Ş, Ğ, Ç, Ö, Ü, İ, ı) ve boşluk kullanılamaz. Sadece büyük harf, rakam ve alt çizgi (_) giriniz. (Örn: SATIS_MUDURU)");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Rol Adı boş bırakılamaz.")
            .MaximumLength(100).WithMessage("Rol Adı en fazla 100 karakter olabilir.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Açıklama en fazla 500 karakter olabilir.");
    }
}
